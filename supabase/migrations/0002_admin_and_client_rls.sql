-- =====================================================================
-- MIGRATION 0002 : SÉPARATION STRICTE ADMIN / CLIENT & RLS SUPABASE
-- =====================================================================

-- 1. Colonne role = 'admin' sur profiles et attribution au compte administrateur
alter table public.profiles
  add column if not exists role text not null default 'admin'
  check (role in ('admin', 'client'));

update public.profiles
set role = 'admin'
where id in (
  select id from auth.users where lower(email) = 'mustaphamahamat98@gmail.com'
)
or id in (select user_id from public.platform_admins);

-- Fonction utilitaire : vérifie si l'utilisateur connecté a role = 'admin'
create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
  or public.is_platform_admin();
$$;

grant execute on function public.is_admin_user() to authenticated, anon;

-- 2. Activer Row Level Security (RLS) sur les tables principales (Factures, Produits, Clients)
alter table public.documents enable row level security;
alter table public.document_lines enable row level security;
alter table public.catalog_items enable row level security;
alter table public.clients enable row level security;
alter table public.payments enable row level security;

-- 3. Politiques RLS Admin : l'Admin (role = 'admin') voit et gère toutes les lignes
drop policy if exists admin_all_documents on public.documents;
create policy admin_all_documents on public.documents
  for all to authenticated
  using (public.is_admin_user() or public.has_org_role(org_id))
  with check (public.is_admin_user() or public.can_write(org_id));

drop policy if exists admin_all_catalog_items on public.catalog_items;
create policy admin_all_catalog_items on public.catalog_items
  for all to authenticated
  using (public.is_admin_user() or public.has_org_role(org_id))
  with check (public.is_admin_user() or public.can_write(org_id));

drop policy if exists admin_all_clients on public.clients;
create policy admin_all_clients on public.clients
  for all to authenticated
  using (public.is_admin_user() or public.has_org_role(org_id))
  with check (public.is_admin_user() or public.can_write(org_id));

-- 4. Accès public Client (/pay/[invoice_id]) :
-- Un client anonyme ne peut lire AUCUNE liste de factures, produits ou clients.
-- Il peut uniquement consulter la facture correspondant à l'identifiant (token ou UUID) dans l'URL.
create or replace function public.get_public_document(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'number', d.number,
    'type', d.doc_type,
    'status', d.status,
    'locale', d.locale,
    'issue_date', d.issue_date,
    'due_date', d.due_date,
    'subtotal', d.subtotal,
    'vat_total', d.vat_total,
    'total', d.total,
    'balance', d.total - d.paid_total - d.credited_total,
    'client_name', c.name,
    'org', jsonb_build_object(
      'name', o.name,
      'city', o.city,
      'phone', o.phone,
      'footer_note', o.footer_note,
      'mtn_momo_number', o.mtn_momo_number,
      'orange_money_number', o.orange_money_number
    ),
    'lines', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'label', l.label,
          'quantity', l.quantity,
          'unit_price', l.unit_price,
          'total', l.line_total
        ) order by l.position
      )
      from public.document_lines l
      where l.document_id = d.id
    ), '[]'::jsonb)
  )
  from public.documents d
  join public.clients c on c.id = d.client_id
  join public.organizations o on o.id = d.org_id
  where (d.public_token = p_token or d.id::text = p_token)
    and d.status <> 'draft'
    and o.suspended_at is null
  limit 1;
$$;

grant execute on function public.get_public_document(text) to anon, authenticated;
