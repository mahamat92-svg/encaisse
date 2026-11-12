-- =====================================================================
-- InnovTech Encaisse — Migration 0001 : schéma initial
-- Cible : Supabase (PostgreSQL 15+). À exécuter UNE FOIS dans
-- Supabase > SQL Editor (ou via `supabase db push`).
--
-- Principes :
--  * Multi-entreprises : chaque ligne métier porte `org_id`.
--  * Isolation garantie PAR LA BASE (Row Level Security) + clés
--    étrangères composites (org_id, id) : impossible de référencer
--    une donnée d'une autre entreprise.
--  * Les opérations sensibles (émission, paiements, quotas,
--    abonnements) passent par des fonctions SECURITY DEFINER qui
--    vérifient le rôle de l'utilisateur.
--  * Montants en francs CFA entiers (bigint), pas de centimes.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Types énumérés
-- ---------------------------------------------------------------------
create type public.org_mode        as enum ('commerce', 'etablissement');
create type public.member_role     as enum ('owner', 'manager', 'viewer');
create type public.client_kind     as enum ('customer', 'student');
create type public.doc_type        as enum ('quote', 'invoice', 'credit_note');
create type public.doc_status      as enum ('draft', 'issued', 'partially_paid', 'paid',
                                            'cancelled', 'accepted', 'refused', 'expired');
create type public.payment_method  as enum ('cash', 'mtn_momo', 'orange_money', 'bank_transfer', 'other');
create type public.payment_status  as enum ('valid', 'cancelled');
create type public.sub_pay_status  as enum ('pending', 'approved', 'rejected');
create type public.reminder_tone   as enum ('courteous', 'firm', 'final');

-- ---------------------------------------------------------------------
-- 1. Utilitaires
-- ---------------------------------------------------------------------

-- Date du jour au Cameroun (UTC+1), indépendante du fuseau du serveur.
create or replace function public.app_today()
returns date language sql stable
as $$ select (now() at time zone 'Africa/Douala')::date $$;

-- Jeton aléatoire non devinable (~244 bits) sans extension.
create or replace function public.random_token()
returns text language sql volatile
as $$ select replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '') $$;

-- Drapeau "opération interne" : autorise les fonctions de confiance
-- à modifier des champs verrouillés. Local à la transaction.
create or replace function public.set_internal(p_on boolean)
returns void language sql volatile
as $$ select set_config('app.internal', case when p_on then 'on' else 'off' end, true) $$;

create or replace function public.is_internal()
returns boolean language sql stable
as $$ select coalesce(current_setting('app.internal', true), 'off') = 'on' $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql
as $$ begin new.updated_at := now(); return new; end $$;

-- ---------------------------------------------------------------------
-- 2. Plateforme : profils, administrateurs, formules
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '' check (char_length(full_name) <= 120),
  phone       text check (char_length(phone) <= 30),
  locale      text not null default 'fr' check (locale in ('fr', 'en')),
  created_at  timestamptz not null default now()
);

create table public.platform_admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table public.plans (
  id           text primary key,
  name         text not null,
  price_month  bigint not null check (price_month >= 0),
  price_year   bigint not null check (price_year >= 0),
  sort_order   int not null default 0,
  -- Quotas : clé absente ou null = illimité. Booléens = fonctionnalités.
  limits       jsonb not null default '{}'::jsonb
);

insert into public.plans (id, name, price_month, price_year, sort_order, limits) values
 ('free',          'Gratuit',          0,      0, 0, '{"documents":15,  "clients":20,   "users":1,  "ai_dictations":5,    "wa_messages":0,    "installments":false, "branding":true}'),
 ('starter',       'Démarrage',     2500,  25000, 1, '{"documents":60,  "clients":150,  "users":1,  "ai_dictations":30,   "wa_messages":0,    "installments":false, "branding":false}'),
 ('pro',           'Pro',           5000,  50000, 2, '{"documents":null,"clients":1000, "users":2,  "ai_dictations":150,  "wa_messages":0,    "installments":true,  "branding":false}'),
 ('business',      'Business',     10000, 100000, 3, '{"documents":null,"clients":3000, "users":5,  "ai_dictations":400,  "wa_messages":300,  "installments":true,  "branding":false}'),
 ('entreprise',    'Entreprise',   25000, 250000, 4, '{"documents":null,"clients":10000,"users":15, "ai_dictations":1500, "wa_messages":1000, "installments":true,  "branding":false}'),
 ('etablissement', 'Établissement',50000, 500000, 5, '{"documents":null,"clients":null, "users":30, "ai_dictations":3000, "wa_messages":3000, "installments":true,  "branding":false}');

-- ---------------------------------------------------------------------
-- 3. Entreprises et membres
-- ---------------------------------------------------------------------
create table public.organizations (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null check (char_length(name) between 2 and 120),
  mode                 public.org_mode not null,
  country              char(2) not null default 'CM',
  currency             char(3) not null default 'XAF',
  city                 text check (char_length(city) <= 80),
  phone                text check (char_length(phone) <= 30),
  address              text check (char_length(address) <= 200),
  niu                  text check (char_length(niu) <= 40),
  rccm                 text check (char_length(rccm) <= 60),
  vat_registered       boolean not null default false,
  vat_rate_bp          int not null default 1925 check (vat_rate_bp between 0 and 10000), -- 1925 = 19,25 %
  footer_note          text check (char_length(footer_note) <= 300),
  default_locale       text not null default 'fr' check (default_locale in ('fr', 'en')),
  mtn_momo_number      text check (char_length(mtn_momo_number) <= 30),
  orange_money_number  text check (char_length(orange_money_number) <= 30),
  logo_url             text check (char_length(logo_url) <= 500),
  reminder_offsets     int[] not null default '{-3,0,3,7,15}',
  trial_ends_at        timestamptz,
  suspended_at         timestamptz,
  created_by           uuid references auth.users (id) on delete set null,
  created_at           timestamptz not null default now()
);

create table public.memberships (
  org_id      uuid not null references public.organizations (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        public.member_role not null default 'manager',
  created_at  timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);

create table public.invitations (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations (id) on delete cascade,
  email        text not null check (char_length(email) <= 254),
  role         public.member_role not null default 'manager' check (role <> 'owner'),
  token        text not null unique default public.random_token(),
  invited_by   uuid references auth.users (id) on delete set null,
  accepted_at  timestamptz,
  expires_at   timestamptz not null default now() + interval '7 days',
  created_at   timestamptz not null default now()
);
create index invitations_org_idx on public.invitations (org_id);

-- ---------------------------------------------------------------------
-- 4. Fonctions de contrôle d'accès
-- ---------------------------------------------------------------------
create or replace function public.has_org_role(
  p_org uuid,
  p_roles public.member_role[] default array['owner','manager','viewer']::public.member_role[])
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = auth.uid() and m.role = any (p_roles))
$$;

-- Écriture autorisée : propriétaire ou gestionnaire d'une entreprise non suspendue.
create or replace function public.can_write(p_org uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select public.has_org_role(p_org, array['owner','manager']::public.member_role[])
     and exists (select 1 from public.organizations o where o.id = p_org and o.suspended_at is null)
$$;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.platform_admins a where a.user_id = auth.uid()) $$;

-- ---------------------------------------------------------------------
-- 5. Abonnements, quotas, usage
-- ---------------------------------------------------------------------
create table public.subscriptions (
  org_id              uuid primary key references public.organizations (id) on delete cascade,
  plan_id             text not null references public.plans (id),
  current_period_end  timestamptz not null,
  updated_at          timestamptz not null default now()
);

create table public.subscription_payments (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations (id) on delete cascade,
  plan_id         text not null references public.plans (id),
  billing_period  text not null check (billing_period in ('month', 'year')),
  amount          bigint not null check (amount > 0),
  method          public.payment_method not null,
  reference       text not null check (char_length(reference) between 3 and 80),
  payer_phone     text check (char_length(payer_phone) <= 30),
  status          public.sub_pay_status not null default 'pending',
  review_note     text check (char_length(review_note) <= 300),
  reviewed_by     uuid references auth.users (id) on delete set null,
  reviewed_at     timestamptz,
  created_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now()
);
create index subscription_payments_org_idx on public.subscription_payments (org_id);
create unique index subscription_payments_ref_uniq
  on public.subscription_payments (method, lower(reference)) where status <> 'rejected';

create table public.usage_counters (
  org_id   uuid not null references public.organizations (id) on delete cascade,
  period   text not null,              -- 'AAAA-MM'
  metric   text not null,
  used     int not null default 0,
  primary key (org_id, period, metric)
);

create table public.ai_usage (
  id              bigint generated always as identity primary key,
  org_id          uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid references auth.users (id) on delete set null,
  feature         text not null,
  model           text not null,
  tokens_in       int not null default 0,
  tokens_out      int not null default 0,
  cost_micro_usd  bigint not null default 0,  -- 1 000 000 = 1 USD
  created_at      timestamptz not null default now()
);
create index ai_usage_org_idx on public.ai_usage (org_id, created_at desc);

-- Formule effective : abonnement payé > essai Pro > Gratuit.
create or replace function public.effective_plan(p_org uuid)
returns text language sql stable security definer set search_path = public
as $$
  select case
    when s.plan_id is not null and s.current_period_end > now() then s.plan_id
    when o.trial_ends_at is not null and o.trial_ends_at > now() then 'pro'
    else 'free' end
  from public.organizations o
  left join public.subscriptions s on s.org_id = o.id
  where o.id = p_org
$$;

-- Limite numérique (null = illimité).
create or replace function public.plan_limit(p_org uuid, p_metric text)
returns int language sql stable security definer set search_path = public
as $$
  select (p.limits ->> p_metric)::int
  from public.plans p where p.id = public.effective_plan(p_org)
$$;

create or replace function public.plan_feature(p_org uuid, p_feature text)
returns boolean language sql stable security definer set search_path = public
as $$
  select coalesce((p.limits ->> p_feature)::boolean, false)
  from public.plans p where p.id = public.effective_plan(p_org)
$$;

-- Consomme un quota mensuel ; lève QUOTA_EXCEEDED si dépassement
-- (l'incrément est alors annulé avec la transaction).
create or replace function public.consume_quota(p_org uuid, p_metric text, p_amount int default 1)
returns int language plpgsql security definer set search_path = public
as $$
declare
  v_limit int;
  v_used  int;
  v_period text := to_char(public.app_today(), 'YYYY-MM');
begin
  if not public.can_write(p_org) then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  if p_metric not in ('documents', 'ai_dictations', 'wa_messages') or p_amount < 1 then
    raise exception using errcode = 'P0001', message = 'INVALID_METRIC';
  end if;
  v_limit := public.plan_limit(p_org, p_metric);
  insert into public.usage_counters as u (org_id, period, metric, used)
  values (p_org, v_period, p_metric, p_amount)
  on conflict (org_id, period, metric) do update set used = u.used + excluded.used
  returning used into v_used;
  if v_limit is not null and v_used > v_limit then
    raise exception using errcode = 'P0001', message = 'QUOTA_EXCEEDED', detail = p_metric;
  end if;
  return v_used;
end $$;

-- Journalisation du coût IA (appelée par le serveur après chaque appel IA).
create or replace function public.log_ai_usage(
  p_org uuid, p_feature text, p_model text, p_tokens_in int, p_tokens_out int, p_cost_micro_usd bigint)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.has_org_role(p_org) then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  insert into public.ai_usage (org_id, user_id, feature, model, tokens_in, tokens_out, cost_micro_usd)
  values (p_org, auth.uid(), left(p_feature, 40), left(p_model, 80),
          greatest(p_tokens_in, 0), greatest(p_tokens_out, 0), greatest(p_cost_micro_usd, 0));
end $$;

-- ---------------------------------------------------------------------
-- 6. Clients / élèves et catalogue
-- ---------------------------------------------------------------------
create table public.clients (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  kind          public.client_kind not null default 'customer',
  name          text not null check (char_length(name) between 1 and 120),
  phone         text check (char_length(phone) <= 30),
  email         text check (char_length(email) <= 254),
  city          text check (char_length(city) <= 80),
  notes         text check (char_length(notes) <= 1000),
  tags          text[] not null default '{}',
  locale        text not null default 'fr' check (locale in ('fr', 'en')),
  credit_limit  bigint check (credit_limit >= 0),
  -- Mode Établissement
  class_name    text check (char_length(class_name) <= 60),
  school_year   text check (char_length(school_year) <= 20),
  payer_name    text check (char_length(payer_name) <= 120),
  payer_phone   text check (char_length(payer_phone) <= 30),
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (org_id, id)
);
create index clients_org_name_idx on public.clients (org_id, name);
create trigger clients_touch before update on public.clients
  for each row execute function public.touch_updated_at();

create table public.catalog_items (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations (id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 120),
  item_kind       text not null default 'product' check (item_kind in ('product', 'service', 'fee')),
  unit            text not null default 'unité' check (char_length(unit) <= 20),
  unit_price      bigint not null default 0 check (unit_price >= 0),
  vat_applicable  boolean not null default true,
  class_name      text check (char_length(class_name) <= 60),
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  unique (org_id, id)
);
create index catalog_items_org_idx on public.catalog_items (org_id, name);

-- Limite du nombre de clients/élèves actifs selon la formule.
create or replace function public.enforce_client_limit()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_limit int; v_count int;
begin
  v_limit := public.plan_limit(new.org_id, 'clients');
  if v_limit is not null then
    select count(*) into v_count from public.clients
    where org_id = new.org_id and archived_at is null;
    if v_count >= v_limit then
      raise exception using errcode = 'P0001', message = 'QUOTA_EXCEEDED', detail = 'clients';
    end if;
  end if;
  return new;
end $$;
create trigger clients_limit before insert on public.clients
  for each row execute function public.enforce_client_limit();

-- ---------------------------------------------------------------------
-- 7. Documents (devis, factures, avoirs)
-- ---------------------------------------------------------------------
create table public.documents (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references public.organizations (id) on delete cascade,
  doc_type             public.doc_type not null,
  status               public.doc_status not null default 'draft',
  number               text,
  client_id            uuid not null,
  related_document_id  uuid,
  issue_date           date,
  due_date             date,
  valid_until          date,
  locale               text not null default 'fr' check (locale in ('fr', 'en')),
  notes                text check (char_length(notes) <= 1000),
  subtotal             bigint not null default 0,
  vat_total            bigint not null default 0,
  total                bigint not null default 0,
  paid_total           bigint not null default 0,
  credited_total       bigint not null default 0,
  public_token         text not null unique default public.random_token(),
  created_by           uuid references auth.users (id) on delete set null,
  issued_at            timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (org_id, id),
  unique (org_id, number),
  foreign key (org_id, client_id) references public.clients (org_id, id),
  foreign key (org_id, related_document_id) references public.documents (org_id, id)
);
create index documents_org_status_idx on public.documents (org_id, doc_type, status);
create index documents_client_idx on public.documents (org_id, client_id);
create trigger documents_touch before update on public.documents
  for each row execute function public.touch_updated_at();

create table public.document_lines (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null,
  document_id      uuid not null,
  position         int not null default 0,
  catalog_item_id  uuid,
  label            text not null check (char_length(label) between 1 and 200),
  quantity         numeric(12,3) not null default 1 check (quantity > 0),
  unit_price       bigint not null default 0 check (unit_price >= 0),
  discount         bigint not null default 0 check (discount >= 0),
  vat_rate_bp      int not null default 0 check (vat_rate_bp between 0 and 10000),
  line_subtotal    bigint not null default 0,
  line_vat         bigint not null default 0,
  line_total       bigint not null default 0,
  foreign key (org_id, document_id) references public.documents (org_id, id) on delete cascade,
  foreign key (org_id, catalog_item_id) references public.catalog_items (org_id, id)
);
create index document_lines_doc_idx on public.document_lines (document_id, position);

create table public.document_installments (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null,
  document_id  uuid not null,
  position     int not null default 0,
  label        text check (char_length(label) <= 80),
  due_date     date not null,
  amount       bigint not null check (amount > 0),
  foreign key (org_id, document_id) references public.documents (org_id, id) on delete cascade
);
create index document_installments_doc_idx on public.document_installments (document_id, position);

create table public.document_counters (
  org_id       uuid not null references public.organizations (id) on delete cascade,
  counter      text not null,       -- 'quote' | 'invoice' | 'credit_note' | 'receipt'
  year         int not null,
  last_number  int not null default 0,
  primary key (org_id, counter, year)
);

-- Garde-fou : un document émis est figé ; les champs calculés ne
-- peuvent être modifiés que par les fonctions internes.
create or replace function public.guard_documents()
returns trigger language plpgsql
as $$
begin
  if public.is_internal() then return new; end if;

  if tg_op = 'INSERT' then
    new.status := 'draft';
    new.number := null;
    new.subtotal := 0; new.vat_total := 0; new.total := 0;
    new.paid_total := 0; new.credited_total := 0;
    new.issued_at := null;
    new.public_token := public.random_token();
    new.created_by := auth.uid();
    return new;
  end if;

  -- UPDATE
  if new.org_id <> old.org_id then
    raise exception using errcode = 'P0001', message = 'DOCUMENT_LOCKED';
  end if;
  if old.status <> 'draft' then
    -- Seule la note interne reste modifiable après émission.
    if (to_jsonb(new) - 'notes' - 'updated_at') <> (to_jsonb(old) - 'notes' - 'updated_at') then
      raise exception using errcode = 'P0001', message = 'DOCUMENT_LOCKED';
    end if;
    return new;
  end if;
  if new.status <> old.status or new.number is distinct from old.number
     or new.subtotal <> old.subtotal or new.vat_total <> old.vat_total or new.total <> old.total
     or new.paid_total <> old.paid_total or new.credited_total <> old.credited_total
     or new.issued_at is distinct from old.issued_at or new.public_token <> old.public_token
     or new.doc_type <> old.doc_type or new.created_by is distinct from old.created_by then
    raise exception using errcode = 'P0001', message = 'DOCUMENT_LOCKED';
  end if;
  return new;
end $$;
create trigger documents_guard before insert or update on public.documents
  for each row execute function public.guard_documents();

-- Lignes : calcul des montants + TVA forcée à 0 si l'entreprise
-- n'est pas assujettie + interdiction de toucher un document émis.
create or replace function public.prepare_document_line()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_status public.doc_status; v_vat boolean;
begin
  select d.status, o.vat_registered into v_status, v_vat
  from public.documents d join public.organizations o on o.id = d.org_id
  where d.id = coalesce(new.document_id, old.document_id);

  if not public.is_internal() and v_status is distinct from 'draft' then
    raise exception using errcode = 'P0001', message = 'DOCUMENT_LOCKED';
  end if;
  if tg_op = 'DELETE' then return old; end if;

  if not v_vat then new.vat_rate_bp := 0; end if;
  new.line_subtotal := greatest(round(new.quantity * new.unit_price)::bigint - new.discount, 0);
  new.line_vat      := round(new.line_subtotal * new.vat_rate_bp / 10000.0)::bigint;
  new.line_total    := new.line_subtotal + new.line_vat;
  return new;
end $$;
create trigger document_lines_prepare before insert or update or delete on public.document_lines
  for each row execute function public.prepare_document_line();

-- Échéanciers : document en brouillon + fonctionnalité incluse dans la formule.
create or replace function public.guard_installments()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_doc record;
begin
  select d.status, d.doc_type, d.org_id into v_doc
  from public.documents d where d.id = coalesce(new.document_id, old.document_id);
  if not public.is_internal() and v_doc.status is distinct from 'draft' then
    raise exception using errcode = 'P0001', message = 'DOCUMENT_LOCKED';
  end if;
  if tg_op = 'INSERT' then
    if v_doc.doc_type <> 'invoice' then
      raise exception using errcode = 'P0001', message = 'INSTALLMENTS_INVOICE_ONLY';
    end if;
    if not public.plan_feature(v_doc.org_id, 'installments') then
      raise exception using errcode = 'P0001', message = 'FEATURE_NOT_IN_PLAN', detail = 'installments';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger document_installments_guard before insert or update or delete on public.document_installments
  for each row execute function public.guard_installments();

-- Totaux d'un document à partir de ses lignes.
create or replace function public.recalc_document_totals(p_doc uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  perform public.set_internal(true);
  update public.documents d set
    subtotal  = coalesce(l.s, 0),
    vat_total = coalesce(l.v, 0),
    total     = coalesce(l.t, 0)
  from (select sum(line_subtotal) s, sum(line_vat) v, sum(line_total) t
        from public.document_lines where document_id = p_doc) l
  where d.id = p_doc;
  perform public.set_internal(false);
end $$;

create or replace function public.after_line_change()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  perform public.recalc_document_totals(coalesce(new.document_id, old.document_id));
  return null;
end $$;
create trigger document_lines_after after insert or update or delete on public.document_lines
  for each row execute function public.after_line_change();

-- ---------------------------------------------------------------------
-- 8. Paiements
-- ---------------------------------------------------------------------
create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations (id) on delete cascade,
  client_id       uuid not null,
  amount          bigint not null check (amount > 0),
  method          public.payment_method not null,
  reference       text check (char_length(reference) <= 80),
  paid_at         date not null default public.app_today(),
  status          public.payment_status not null default 'valid',
  note            text check (char_length(note) <= 300),
  cancel_reason   text check (char_length(cancel_reason) <= 300),
  cancelled_at    timestamptz,
  receipt_number  text,
  created_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (org_id, id),
  foreign key (org_id, client_id) references public.clients (org_id, id)
);
create index payments_org_idx on public.payments (org_id, paid_at desc);
-- Anti-fraude / anti-doublon : une référence MoMo/OM ne peut servir qu'une fois.
create unique index payments_reference_uniq
  on public.payments (org_id, method, lower(reference))
  where reference is not null and status = 'valid';

create table public.payment_allocations (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null,
  payment_id   uuid not null,
  document_id  uuid not null,
  amount       bigint not null check (amount > 0),
  foreign key (org_id, payment_id) references public.payments (org_id, id) on delete cascade,
  foreign key (org_id, document_id) references public.documents (org_id, id)
);
create index payment_allocations_doc_idx on public.payment_allocations (document_id);
create index payment_allocations_pay_idx on public.payment_allocations (payment_id);

-- Solde et statut d'une facture (paiements valides + avoirs émis).
create or replace function public.recalc_document_balance(p_doc uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare v_paid bigint; v_credited bigint; v_doc record;
begin
  select * into v_doc from public.documents where id = p_doc;
  if not found or v_doc.doc_type <> 'invoice' then return; end if;

  select coalesce(sum(a.amount), 0) into v_paid
  from public.payment_allocations a join public.payments p on p.id = a.payment_id
  where a.document_id = p_doc and p.status = 'valid';

  select coalesce(sum(c.total), 0) into v_credited
  from public.documents c
  where c.related_document_id = p_doc and c.doc_type = 'credit_note' and c.status = 'issued';

  perform public.set_internal(true);
  update public.documents set
    paid_total = v_paid,
    credited_total = v_credited,
    status = case
      when status not in ('issued', 'partially_paid', 'paid', 'cancelled') then status
      when v_paid = 0 and v_credited >= total then 'cancelled'::public.doc_status
      when v_paid + v_credited >= total then 'paid'::public.doc_status
      when v_paid + v_credited > 0 then 'partially_paid'::public.doc_status
      else 'issued'::public.doc_status end
  where id = p_doc;
  perform public.set_internal(false);
end $$;

-- ---------------------------------------------------------------------
-- 9. Relances
-- ---------------------------------------------------------------------
create table public.reminder_logs (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null,
  document_id  uuid not null,
  tone         public.reminder_tone not null default 'courteous',
  channel      text not null default 'whatsapp_link' check (channel in ('whatsapp_link', 'whatsapp_api', 'other')),
  message      text not null check (char_length(message) <= 2000),
  sent_by      uuid references auth.users (id) on delete set null,
  sent_at      timestamptz not null default now(),
  foreign key (org_id, document_id) references public.documents (org_id, id) on delete cascade
);
create index reminder_logs_doc_idx on public.reminder_logs (document_id, sent_at desc);

-- ---------------------------------------------------------------------
-- 10. Historique (audit) et support
-- ---------------------------------------------------------------------
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  org_id      uuid,                 -- volontairement sans clé étrangère (trace conservée)
  user_id     uuid,
  action      text not null,
  entity      text not null,
  entity_id   text,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_org_idx on public.audit_logs (org_id, created_at desc);

create table public.support_tickets (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references public.organizations (id) on delete set null,
  user_id     uuid references auth.users (id) on delete set null,
  subject     text not null check (char_length(subject) between 3 and 120),
  message     text not null check (char_length(message) between 3 and 4000),
  status      text not null default 'open' check (status in ('open', 'closed')),
  created_at  timestamptz not null default now()
);

create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_details jsonb;
  v_org uuid;
begin
  if tg_op = 'UPDATE' then
    select coalesce(jsonb_object_agg(n.key, n.value), '{}'::jsonb) into v_details
    from jsonb_each(v_new) n
    where n.value is distinct from (v_old -> n.key) and n.key not in ('updated_at');
    if v_details = '{}'::jsonb then return null; end if;
  else
    v_details := v_row - 'public_token' - 'token';
  end if;
  v_org := case when tg_table_name = 'organizations' then (v_row ->> 'id')::uuid
                else (v_row ->> 'org_id')::uuid end;
  insert into public.audit_logs (org_id, user_id, action, entity, entity_id, details)
  values (v_org, auth.uid(), lower(tg_op), tg_table_name,
          coalesce(v_row ->> 'id', v_row ->> 'user_id'), v_details);
  return null;
end $$;

create trigger audit_organizations after insert or update or delete on public.organizations
  for each row execute function public.audit_row();
create trigger audit_memberships after insert or update or delete on public.memberships
  for each row execute function public.audit_row();
create trigger audit_clients after insert or update or delete on public.clients
  for each row execute function public.audit_row();
create trigger audit_documents after insert or update or delete on public.documents
  for each row execute function public.audit_row();
create trigger audit_payments after insert or update or delete on public.payments
  for each row execute function public.audit_row();
create trigger audit_subscription_payments after insert or update on public.subscription_payments
  for each row execute function public.audit_row();

-- ---------------------------------------------------------------------
-- 11. Fonctions métier (API sécurisée appelée par l'application)
-- ---------------------------------------------------------------------

-- Création d'une entreprise + propriétaire + essai Pro de 14 jours.
create or replace function public.create_organization(
  p_name text, p_mode public.org_mode, p_city text default null, p_phone text default null)
returns uuid language plpgsql security definer set search_path = public
as $$
declare v_org uuid; v_count int;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'NOT_AUTHENTICATED';
  end if;
  select count(*) into v_count from public.memberships where user_id = auth.uid() and role = 'owner';
  if v_count >= 5 then
    raise exception using errcode = 'P0001', message = 'TOO_MANY_ORGANIZATIONS';
  end if;
  insert into public.organizations (name, mode, city, phone, trial_ends_at, created_by)
  values (trim(p_name), p_mode, nullif(trim(p_city), ''), nullif(trim(p_phone), ''),
          now() + interval '14 days', auth.uid())
  returning id into v_org;
  insert into public.memberships (org_id, user_id, role) values (v_org, auth.uid(), 'owner');
  return v_org;
end $$;

-- Prochain numéro (sans trou : le compteur est annulé avec la transaction).
create or replace function public.next_counter(p_org uuid, p_counter text)
returns int language plpgsql security definer set search_path = public
as $$
declare v_n int; v_year int := extract(year from public.app_today())::int;
begin
  insert into public.document_counters as c (org_id, counter, year, last_number)
  values (p_org, p_counter, v_year, 1)
  on conflict (org_id, counter, year) do update set last_number = c.last_number + 1
  returning last_number into v_n;
  return v_n;
end $$;

create or replace function public.format_number(p_prefix text, p_n int)
returns text language sql immutable
as $$ select p_prefix || '-' || extract(year from public.app_today())::int || '-' || lpad(p_n::text, 4, '0') $$;

-- Émission d'un document (devis, facture, avoir).
create or replace function public.issue_document(p_doc uuid)
returns public.documents language plpgsql security definer set search_path = public
as $$
declare
  d public.documents;
  v_lines int;
  v_inst_count int;
  v_inst_sum bigint;
  v_rel public.documents;
  v_prefix text;
  v_n int;
begin
  select * into d from public.documents where id = p_doc for update;
  if not found or not public.has_org_role(d.org_id) then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if not public.can_write(d.org_id) then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  if d.status <> 'draft' then
    raise exception using errcode = 'P0001', message = 'NOT_DRAFT';
  end if;
  select count(*) into v_lines from public.document_lines where document_id = d.id;
  if v_lines = 0 then
    raise exception using errcode = 'P0001', message = 'NO_LINES';
  end if;
  if d.total <= 0 then
    raise exception using errcode = 'P0001', message = 'ZERO_TOTAL';
  end if;

  select count(*), coalesce(sum(amount), 0) into v_inst_count, v_inst_sum
  from public.document_installments where document_id = d.id;
  if v_inst_count > 0 and v_inst_sum <> d.total then
    raise exception using errcode = 'P0001', message = 'INSTALLMENTS_MISMATCH';
  end if;

  if d.doc_type = 'credit_note' then
    select * into v_rel from public.documents where id = d.related_document_id for update;
    if not found or v_rel.doc_type <> 'invoice' or v_rel.org_id <> d.org_id
       or v_rel.client_id <> d.client_id
       or v_rel.status not in ('issued', 'partially_paid') then
      raise exception using errcode = 'P0001', message = 'INVALID_CREDIT_NOTE';
    end if;
    if d.total > v_rel.total - v_rel.paid_total - v_rel.credited_total then
      raise exception using errcode = 'P0001', message = 'CREDIT_EXCEEDS_BALANCE';
    end if;
  else
    perform public.consume_quota(d.org_id, 'documents', 1);
  end if;

  v_prefix := case d.doc_type when 'quote' then 'DEV' when 'invoice' then 'FAC' else 'AVO' end;
  v_n := public.next_counter(d.org_id, d.doc_type::text);

  perform public.set_internal(true);
  update public.documents set
    status     = 'issued',
    number     = public.format_number(v_prefix, v_n),
    issue_date = coalesce(issue_date, public.app_today()),
    due_date   = case when doc_type = 'invoice'
                      then coalesce(due_date, issue_date, public.app_today()) else due_date end,
    issued_at  = now()
  where id = d.id
  returning * into d;
  perform public.set_internal(false);

  if d.doc_type = 'credit_note' then
    perform public.recalc_document_balance(d.related_document_id);
  end if;
  return d;
end $$;

-- Devis : accepté / refusé / expiré.
create or replace function public.set_quote_status(p_doc uuid, p_status public.doc_status)
returns void language plpgsql security definer set search_path = public
as $$
declare d public.documents;
begin
  select * into d from public.documents where id = p_doc for update;
  if not found or not public.has_org_role(d.org_id) then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if not public.can_write(d.org_id) then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  if d.doc_type <> 'quote' or d.status not in ('issued', 'accepted', 'refused', 'expired')
     or p_status not in ('issued', 'accepted', 'refused', 'expired') then
    raise exception using errcode = 'P0001', message = 'INVALID_STATUS';
  end if;
  perform public.set_internal(true);
  update public.documents set status = p_status where id = p_doc;
  perform public.set_internal(false);
end $$;

-- Devis → facture (brouillon) en un clic.
create or replace function public.convert_quote_to_invoice(p_quote uuid)
returns uuid language plpgsql security definer set search_path = public
as $$
declare q public.documents; v_new uuid;
begin
  select * into q from public.documents where id = p_quote;
  if not found or not public.has_org_role(q.org_id) then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if not public.can_write(q.org_id) then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  if q.doc_type <> 'quote' or q.status not in ('issued', 'accepted') then
    raise exception using errcode = 'P0001', message = 'INVALID_STATUS';
  end if;
  insert into public.documents (org_id, doc_type, client_id, related_document_id, locale, notes)
  values (q.org_id, 'invoice', q.client_id, q.id, q.locale, q.notes)
  returning id into v_new;
  insert into public.document_lines (org_id, document_id, position, catalog_item_id, label,
                                     quantity, unit_price, discount, vat_rate_bp)
  select org_id, v_new, position, catalog_item_id, label, quantity, unit_price, discount, vat_rate_bp
  from public.document_lines where document_id = q.id;
  perform public.set_internal(true);
  update public.documents set status = 'accepted' where id = q.id;
  perform public.set_internal(false);
  return v_new;
end $$;

-- Enregistrement d'un paiement + imputation (sur une facture ou
-- automatiquement sur les dettes les plus anciennes) + numéro de reçu.
create or replace function public.record_payment(
  p_org uuid, p_client uuid, p_amount bigint, p_method public.payment_method,
  p_reference text default null, p_paid_at date default null,
  p_document uuid default null, p_note text default null)
returns public.payments language plpgsql security definer set search_path = public
as $$
declare
  v_pay public.payments;
  v_left bigint := p_amount;
  v_doc record;
  v_part bigint;
  v_balance bigint;
begin
  if not public.can_write(p_org) then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception using errcode = 'P0001', message = 'INVALID_AMOUNT';
  end if;
  if not exists (select 1 from public.clients where id = p_client and org_id = p_org) then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if p_document is not null then
    select * into v_doc from public.documents
    where id = p_document and org_id = p_org and client_id = p_client
      and doc_type = 'invoice' and status in ('issued', 'partially_paid')
    for update;
    if not found then
      raise exception using errcode = 'P0001', message = 'INVALID_DOCUMENT';
    end if;
    v_balance := v_doc.total - v_doc.paid_total - v_doc.credited_total;
    if p_amount > v_balance then
      raise exception using errcode = 'P0001', message = 'AMOUNT_EXCEEDS_BALANCE';
    end if;
  end if;

  begin
    insert into public.payments (org_id, client_id, amount, method, reference, paid_at, note,
                                 receipt_number, created_by)
    values (p_org, p_client, p_amount, p_method, nullif(trim(p_reference), ''),
            coalesce(p_paid_at, public.app_today()), p_note,
            public.format_number('REC', public.next_counter(p_org, 'receipt')), auth.uid())
    returning * into v_pay;
  exception when unique_violation then
    raise exception using errcode = 'P0001', message = 'DUPLICATE_REFERENCE';
  end;

  if p_document is not null then
    insert into public.payment_allocations (org_id, payment_id, document_id, amount)
    values (p_org, v_pay.id, p_document, p_amount);
    perform public.recalc_document_balance(p_document);
  else
    for v_doc in
      select id, total - paid_total - credited_total as balance
      from public.documents
      where org_id = p_org and client_id = p_client and doc_type = 'invoice'
        and status in ('issued', 'partially_paid')
      order by coalesce(due_date, issue_date), issue_date, number
      for update
    loop
      exit when v_left <= 0;
      v_part := least(v_left, v_doc.balance);
      if v_part > 0 then
        insert into public.payment_allocations (org_id, payment_id, document_id, amount)
        values (p_org, v_pay.id, v_doc.id, v_part);
        perform public.recalc_document_balance(v_doc.id);
        v_left := v_left - v_part;
      end if;
    end loop;
  end if;
  return v_pay;
end $$;

-- Annulation d'un paiement (motif obligatoire, tracée).
create or replace function public.cancel_payment(p_payment uuid, p_reason text)
returns void language plpgsql security definer set search_path = public
as $$
declare v_pay public.payments; v_doc uuid;
begin
  select * into v_pay from public.payments where id = p_payment for update;
  if not found or not public.has_org_role(v_pay.org_id) then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if not public.can_write(v_pay.org_id) then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  if v_pay.status <> 'valid' then
    raise exception using errcode = 'P0001', message = 'ALREADY_CANCELLED';
  end if;
  if p_reason is null or char_length(trim(p_reason)) < 3 then
    raise exception using errcode = 'P0001', message = 'REASON_REQUIRED';
  end if;
  update public.payments set status = 'cancelled', cancel_reason = trim(p_reason), cancelled_at = now()
  where id = p_payment;
  for v_doc in select distinct document_id from public.payment_allocations where payment_id = p_payment loop
    perform public.recalc_document_balance(v_doc);
  end loop;
end $$;

-- Journalise une relance envoyée (via lien WhatsApp).
create or replace function public.log_reminder(p_doc uuid, p_tone public.reminder_tone, p_message text)
returns void language plpgsql security definer set search_path = public
as $$
declare d public.documents;
begin
  select * into d from public.documents where id = p_doc;
  if not found or not public.has_org_role(d.org_id) then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if not public.can_write(d.org_id) then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  insert into public.reminder_logs (org_id, document_id, tone, message, sent_by)
  values (d.org_id, d.id, p_tone, left(p_message, 2000), auth.uid());
end $$;

-- Invitations de collaborateurs.
create or replace function public.create_invitation(p_org uuid, p_email text, p_role public.member_role)
returns text language plpgsql security definer set search_path = public
as $$
declare v_limit int; v_count int; v_token text;
begin
  if not public.has_org_role(p_org, array['owner']::public.member_role[]) then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  if p_role = 'owner' then
    raise exception using errcode = 'P0001', message = 'INVALID_ROLE';
  end if;
  v_limit := public.plan_limit(p_org, 'users');
  select (select count(*) from public.memberships where org_id = p_org)
       + (select count(*) from public.invitations
          where org_id = p_org and accepted_at is null and expires_at > now())
  into v_count;
  if v_limit is not null and v_count >= v_limit then
    raise exception using errcode = 'P0001', message = 'QUOTA_EXCEEDED', detail = 'users';
  end if;
  insert into public.invitations (org_id, email, role, invited_by)
  values (p_org, lower(trim(p_email)), p_role, auth.uid())
  returning token into v_token;
  return v_token;
end $$;

create or replace function public.accept_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare v_inv public.invitations; v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  select * into v_inv from public.invitations where token = p_token for update;
  if not found or v_inv.accepted_at is not null or v_inv.expires_at < now()
     or v_inv.email <> v_email then
    raise exception using errcode = 'P0001', message = 'INVALID_INVITATION';
  end if;
  insert into public.memberships (org_id, user_id, role) values (v_inv.org_id, auth.uid(), v_inv.role)
  on conflict (org_id, user_id) do nothing;
  update public.invitations set accepted_at = now() where id = v_inv.id;
  return v_inv.org_id;
end $$;

-- Abonnement : déclaration d'un paiement manuel (par le propriétaire).
create or replace function public.submit_subscription_payment(
  p_org uuid, p_plan text, p_period text, p_method public.payment_method,
  p_reference text, p_payer_phone text default null)
returns uuid language plpgsql security definer set search_path = public
as $$
declare v_amount bigint; v_id uuid;
begin
  if not public.has_org_role(p_org, array['owner']::public.member_role[]) then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  select case when p_period = 'year' then price_year else price_month end into v_amount
  from public.plans where id = p_plan and price_month > 0;
  if v_amount is null or p_period not in ('month', 'year') then
    raise exception using errcode = 'P0001', message = 'INVALID_PLAN';
  end if;
  begin
    insert into public.subscription_payments (org_id, plan_id, billing_period, amount, method,
                                              reference, payer_phone, created_by)
    values (p_org, p_plan, p_period, v_amount, p_method, trim(p_reference), p_payer_phone, auth.uid())
    returning id into v_id;
  exception when unique_violation then
    raise exception using errcode = 'P0001', message = 'DUPLICATE_REFERENCE';
  end;
  return v_id;
end $$;

-- Abonnement : validation ou refus par le super-administrateur.
create or replace function public.review_subscription_payment(p_id uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public
as $$
declare v_sp public.subscription_payments; v_sub public.subscriptions; v_start timestamptz;
begin
  if not public.is_platform_admin() then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  select * into v_sp from public.subscription_payments where id = p_id for update;
  if not found or v_sp.status <> 'pending' then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  update public.subscription_payments set
    status = case when p_approve then 'approved'::public.sub_pay_status else 'rejected'::public.sub_pay_status end,
    review_note = p_note, reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_id;
  if p_approve then
    select * into v_sub from public.subscriptions where org_id = v_sp.org_id for update;
    -- Prolongation si même formule encore active, sinon départ immédiat.
    v_start := case when found and v_sub.plan_id = v_sp.plan_id and v_sub.current_period_end > now()
                    then v_sub.current_period_end else now() end;
    insert into public.subscriptions (org_id, plan_id, current_period_end, updated_at)
    values (v_sp.org_id, v_sp.plan_id,
            v_start + case when v_sp.billing_period = 'year' then interval '1 year' else interval '1 month' end,
            now())
    on conflict (org_id) do update set
      plan_id = excluded.plan_id, current_period_end = excluded.current_period_end, updated_at = now();
  end if;
end $$;

-- Page publique d'une facture (lien partagé par WhatsApp, sans compte).
create or replace function public.get_public_document(p_token text)
returns jsonb language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'number', d.number, 'type', d.doc_type, 'status', d.status, 'locale', d.locale,
    'issue_date', d.issue_date, 'due_date', d.due_date,
    'subtotal', d.subtotal, 'vat_total', d.vat_total, 'total', d.total,
    'balance', d.total - d.paid_total - d.credited_total,
    'client_name', c.name,
    'org', jsonb_build_object('name', o.name, 'city', o.city, 'phone', o.phone, 'logo_url', o.logo_url,
                              'niu', o.niu, 'rccm', o.rccm, 'footer_note', o.footer_note,
                              'mtn_momo_number', o.mtn_momo_number,
                              'orange_money_number', o.orange_money_number,
                              'vat_registered', o.vat_registered,
                              'branding', public.plan_feature(o.id, 'branding')),
    'lines', coalesce((select jsonb_agg(jsonb_build_object(
                'label', l.label, 'quantity', l.quantity, 'unit_price', l.unit_price,
                'discount', l.discount, 'vat_rate_bp', l.vat_rate_bp, 'total', l.line_total)
              order by l.position) from public.document_lines l where l.document_id = d.id), '[]'::jsonb),
    'installments', coalesce((select jsonb_agg(jsonb_build_object(
                'label', i.label, 'due_date', i.due_date, 'amount', i.amount) order by i.position)
              from public.document_installments i where i.document_id = d.id), '[]'::jsonb))
  from public.documents d
  join public.clients c on c.id = d.client_id
  join public.organizations o on o.id = d.org_id
  where d.public_token = p_token and d.status <> 'draft' and o.suspended_at is null
$$;

-- Profil créé automatiquement à l'inscription.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, locale)
  values (new.id,
          left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
          left(new.raw_user_meta_data ->> 'phone', 30),
          case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'fr' end)
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 12. Vues (respectent la RLS de l'utilisateur : security_invoker)
-- ---------------------------------------------------------------------
create view public.v_document_balances with (security_invoker = true) as
select
  d.*,
  d.total - d.paid_total - d.credited_total as balance,
  coalesce(inst.due_date, d.due_date, d.issue_date) as current_due_date,
  greatest(public.app_today() - coalesce(inst.due_date, d.due_date, d.issue_date), 0) as days_overdue
from public.documents d
left join lateral (
  select x.due_date from (
    select i.due_date, sum(i.amount) over (order by i.position, i.due_date, i.id) as cum
    from public.document_installments i where i.document_id = d.id
  ) x
  where x.cum > d.paid_total + d.credited_total
  order by x.cum limit 1
) inst on true;

create view public.v_client_balances with (security_invoker = true) as
select
  c.id as client_id, c.org_id, c.name, c.kind, c.phone, c.payer_name, c.payer_phone, c.class_name,
  coalesce(sum(b.balance) filter (where b.doc_type = 'invoice' and b.status in ('issued','partially_paid')), 0) as balance,
  coalesce(sum(b.balance) filter (where b.doc_type = 'invoice' and b.status in ('issued','partially_paid')
                                   and b.current_due_date < public.app_today()), 0) as overdue_balance
from public.clients c
left join public.v_document_balances b on b.client_id = c.id
group by c.id;

-- File "À relancer aujourd'hui" selon le calendrier de l'entreprise.
create view public.v_reminders_due with (security_invoker = true) as
select
  b.id as document_id, b.org_id, b.number, b.client_id, c.name as client_name,
  coalesce(nullif(c.payer_phone, ''), c.phone) as whatsapp_phone, c.locale as client_locale,
  b.balance, b.current_due_date, b.days_overdue, st.step, lr.last_sent_at,
  case when st.step <= 0 then 'courteous' when st.step < 15 then 'firm' else 'final' end::public.reminder_tone as suggested_tone
from public.v_document_balances b
join public.clients c on c.id = b.client_id
join public.organizations o on o.id = b.org_id
left join lateral (select max(r.sent_at) as last_sent_at from public.reminder_logs r where r.document_id = b.id) lr on true
left join lateral (
  select max(off) as step from unnest(o.reminder_offsets) as off
  where b.current_due_date + off <= public.app_today()
) st on true
where b.doc_type = 'invoice'
  and b.status in ('issued', 'partially_paid')
  and b.balance > 0
  and st.step is not null
  and (lr.last_sent_at is null
       or (lr.last_sent_at at time zone 'Africa/Douala')::date < b.current_due_date + st.step);

-- Tableau de bord.
create view public.v_dashboard with (security_invoker = true) as
select
  o.id as org_id,
  coalesce((select sum(balance) from public.v_document_balances b
            where b.org_id = o.id and b.doc_type = 'invoice' and b.status in ('issued','partially_paid')), 0) as receivable,
  coalesce((select sum(balance) from public.v_document_balances b
            where b.org_id = o.id and b.doc_type = 'invoice' and b.status in ('issued','partially_paid')
              and b.current_due_date < public.app_today()), 0) as overdue,
  coalesce((select sum(amount) from public.payments p
            where p.org_id = o.id and p.status = 'valid'
              and date_trunc('month', p.paid_at) = date_trunc('month', public.app_today())), 0) as collected_this_month,
  (select count(*) from public.v_reminders_due r where r.org_id = o.id) as reminders_due
from public.organizations o;

-- ---------------------------------------------------------------------
-- 13. Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles              enable row level security;
alter table public.platform_admins       enable row level security;
alter table public.plans                 enable row level security;
alter table public.organizations         enable row level security;
alter table public.memberships           enable row level security;
alter table public.invitations           enable row level security;
alter table public.subscriptions         enable row level security;
alter table public.subscription_payments enable row level security;
alter table public.usage_counters        enable row level security;
alter table public.ai_usage              enable row level security;
alter table public.clients               enable row level security;
alter table public.catalog_items         enable row level security;
alter table public.documents             enable row level security;
alter table public.document_lines        enable row level security;
alter table public.document_installments enable row level security;
alter table public.document_counters     enable row level security;  -- aucune politique : fonctions uniquement
alter table public.payments              enable row level security;
alter table public.payment_allocations   enable row level security;
alter table public.reminder_logs         enable row level security;
alter table public.audit_logs            enable row level security;
alter table public.support_tickets       enable row level security;

-- Profils : chacun le sien (+ collègues en lecture).
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or exists (
    select 1 from public.memberships a join public.memberships b on a.org_id = b.org_id
    where a.user_id = auth.uid() and b.user_id = profiles.id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy platform_admins_select on public.platform_admins for select to authenticated
  using (user_id = auth.uid());

-- Formules : publiques (page Tarifs).
create policy plans_select on public.plans for select to anon, authenticated using (true);

-- Entreprises.
create policy organizations_select on public.organizations for select to authenticated
  using (public.has_org_role(id) or public.is_platform_admin());
create policy organizations_update on public.organizations for update to authenticated
  using (public.has_org_role(id, array['owner']::public.member_role[]))
  with check (public.has_org_role(id, array['owner']::public.member_role[]));
-- (création : fonction create_organization ; suspension : administrateur via service)

-- Membres.
create policy memberships_select on public.memberships for select to authenticated
  using (public.has_org_role(org_id));
create policy memberships_update on public.memberships for update to authenticated
  using (public.has_org_role(org_id, array['owner']::public.member_role[]) and user_id <> auth.uid())
  with check (public.has_org_role(org_id, array['owner']::public.member_role[]) and role <> 'owner');
create policy memberships_delete on public.memberships for delete to authenticated
  using ((public.has_org_role(org_id, array['owner']::public.member_role[]) and role <> 'owner')
         or (user_id = auth.uid() and role <> 'owner'));

create policy invitations_select on public.invitations for select to authenticated
  using (public.has_org_role(org_id, array['owner']::public.member_role[]));
create policy invitations_delete on public.invitations for delete to authenticated
  using (public.has_org_role(org_id, array['owner']::public.member_role[]));

-- Abonnements, quotas, coûts IA : lecture par les membres.
create policy subscriptions_select on public.subscriptions for select to authenticated
  using (public.has_org_role(org_id) or public.is_platform_admin());
create policy subscription_payments_select on public.subscription_payments for select to authenticated
  using (public.has_org_role(org_id, array['owner']::public.member_role[]) or public.is_platform_admin());
create policy usage_counters_select on public.usage_counters for select to authenticated
  using (public.has_org_role(org_id) or public.is_platform_admin());
create policy ai_usage_select on public.ai_usage for select to authenticated
  using (public.has_org_role(org_id, array['owner']::public.member_role[]) or public.is_platform_admin());

-- Clients / élèves.
create policy clients_select on public.clients for select to authenticated
  using (public.has_org_role(org_id));
create policy clients_insert on public.clients for insert to authenticated
  with check (public.can_write(org_id));
create policy clients_update on public.clients for update to authenticated
  using (public.can_write(org_id)) with check (public.can_write(org_id));
create policy clients_delete on public.clients for delete to authenticated
  using (public.has_org_role(org_id, array['owner']::public.member_role[]));

-- Catalogue.
create policy catalog_select on public.catalog_items for select to authenticated
  using (public.has_org_role(org_id));
create policy catalog_insert on public.catalog_items for insert to authenticated
  with check (public.can_write(org_id));
create policy catalog_update on public.catalog_items for update to authenticated
  using (public.can_write(org_id)) with check (public.can_write(org_id));
create policy catalog_delete on public.catalog_items for delete to authenticated
  using (public.can_write(org_id));

-- Documents : écriture directe uniquement sur les brouillons.
create policy documents_select on public.documents for select to authenticated
  using (public.has_org_role(org_id));
create policy documents_insert on public.documents for insert to authenticated
  with check (public.can_write(org_id));
create policy documents_update on public.documents for update to authenticated
  using (public.can_write(org_id)) with check (public.can_write(org_id));
create policy documents_delete on public.documents for delete to authenticated
  using (public.can_write(org_id) and status = 'draft');

create policy lines_select on public.document_lines for select to authenticated
  using (public.has_org_role(org_id));
create policy lines_insert on public.document_lines for insert to authenticated
  with check (public.can_write(org_id));
create policy lines_update on public.document_lines for update to authenticated
  using (public.can_write(org_id)) with check (public.can_write(org_id));
create policy lines_delete on public.document_lines for delete to authenticated
  using (public.can_write(org_id));

create policy installments_select on public.document_installments for select to authenticated
  using (public.has_org_role(org_id));
create policy installments_insert on public.document_installments for insert to authenticated
  with check (public.can_write(org_id));
create policy installments_update on public.document_installments for update to authenticated
  using (public.can_write(org_id)) with check (public.can_write(org_id));
create policy installments_delete on public.document_installments for delete to authenticated
  using (public.can_write(org_id));

-- Paiements, imputations, relances : lecture ; écriture via fonctions.
create policy payments_select on public.payments for select to authenticated
  using (public.has_org_role(org_id));
create policy allocations_select on public.payment_allocations for select to authenticated
  using (public.has_org_role(org_id));
create policy reminder_logs_select on public.reminder_logs for select to authenticated
  using (public.has_org_role(org_id));

-- Historique : propriétaire uniquement, lecture seule.
create policy audit_logs_select on public.audit_logs for select to authenticated
  using (public.has_org_role(org_id, array['owner']::public.member_role[]) or public.is_platform_admin());

-- Support.
create policy support_insert on public.support_tickets for insert to authenticated
  with check (user_id = auth.uid() and (org_id is null or public.has_org_role(org_id)));
create policy support_select on public.support_tickets for select to authenticated
  using (user_id = auth.uid() or public.is_platform_admin());

-- ---------------------------------------------------------------------
-- 14. Droits d'exécution des fonctions
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon;

grant execute on function
  public.app_today(),
  public.has_org_role(uuid, public.member_role[]),
  public.can_write(uuid),
  public.is_platform_admin(),
  public.effective_plan(uuid),
  public.plan_limit(uuid, text),
  public.plan_feature(uuid, text),
  public.consume_quota(uuid, text, int),
  public.log_ai_usage(uuid, text, text, int, int, bigint),
  public.create_organization(text, public.org_mode, text, text),
  public.issue_document(uuid),
  public.set_quote_status(uuid, public.doc_status),
  public.convert_quote_to_invoice(uuid),
  public.record_payment(uuid, uuid, bigint, public.payment_method, text, date, uuid, text),
  public.cancel_payment(uuid, text),
  public.log_reminder(uuid, public.reminder_tone, text),
  public.create_invitation(uuid, text, public.member_role),
  public.accept_invitation(text),
  public.submit_subscription_payment(uuid, text, text, public.payment_method, text, text),
  public.review_subscription_payment(uuid, boolean, text)
to authenticated;

-- Fonctions utilisées par les politiques/vues/triggers/valeurs par défaut.
grant execute on all functions in schema public to authenticated, service_role, supabase_auth_admin;

grant execute on function public.get_public_document(text) to anon, authenticated;

-- Fin de la migration 0001.

