-- =====================================================================
-- MIGRATION 0003 : TABLE merchant_settings, BUCKET logos & FACTURE PRO
-- =====================================================================

-- 1. Table 'merchant_settings' (une ligne par administrateur)
create table if not exists public.merchant_settings (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  org_id          uuid references public.organizations (id) on delete cascade,
  company_name    text not null default '',
  business_type   text not null default 'boutique' check (business_type in ('boutique', 'ecole', 'clinique', 'immobilier', 'artisan', 'ong')),
  logo_url        text,
  whatsapp_phone  text default '23566268503',
  address_city    text,
  email           text,
  rccm_niu        text,
  slogan          text,
  primary_color   text not null default 'green' check (primary_color in ('green', 'blue', 'gold', 'orange', 'black')),
  updated_at      timestamptz not null default now()
);

alter table public.merchant_settings
  add column if not exists business_type text not null default 'boutique';

alter table public.merchant_settings enable row level security;

drop policy if exists merchant_settings_admin_all on public.merchant_settings;
create policy merchant_settings_admin_all on public.merchant_settings
  for all to authenticated
  using (user_id = auth.uid() or public.is_platform_admin())
  with check (user_id = auth.uid() or public.is_platform_admin());

-- Lecture publique pour afficher l'en-tête marchand sur les factures /pay/[invoice_id]
drop policy if exists merchant_settings_public_read on public.merchant_settings;
create policy merchant_settings_public_read on public.merchant_settings
  for select to anon, authenticated
  using (true);

-- 2. Bucket Supabase Storage 'logos' pour l'upload du logo (PNG/JPG)
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do update set public = true;

drop policy if exists logos_public_read on storage.objects;
create policy logos_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'logos');

drop policy if exists logos_admin_insert on storage.objects;
create policy logos_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'logos');

drop policy if exists logos_admin_update on storage.objects;
create policy logos_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'logos')
  with check (bucket_id = 'logos');

-- 3. Mise à jour de get_public_document(p_token) pour inclure le téléphone client et le branding marchand
create or replace function public.get_public_document(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', d.id,
    'public_token', d.public_token,
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
    'client_phone', coalesce(c.phone, c.payer_phone, ''),
    'org', jsonb_build_object(
      'name', coalesce(nullif(ms.company_name, ''), o.name),
      'logo_url', coalesce(nullif(ms.logo_url, ''), o.logo_url),
      'city', coalesce(nullif(ms.address_city, ''), o.city),
      'phone', coalesce(nullif(ms.whatsapp_phone, ''), o.phone),
      'email', coalesce(ms.email, ''),
      'rccm_niu', coalesce(nullif(ms.rccm_niu, ''), o.rccm, o.niu, ''),
      'slogan', coalesce(ms.slogan, ''),
      'primary_color', coalesce(ms.primary_color, 'green'),
      'niu', o.niu,
      'rccm', o.rccm,
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
  left join lateral (
    select * from public.merchant_settings m
    where m.org_id = o.id
    order by m.updated_at desc
    limit 1
  ) ms on true
  where (d.public_token = p_token or d.id::text = p_token)
    and d.status <> 'draft'
    and o.suspended_at is null
  limit 1;
$$;

grant execute on function public.get_public_document(text) to anon, authenticated;

