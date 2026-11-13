-- Migration 0006 : Publier mes Produits en 1 clic (/produits)

create table if not exists public.social_products (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organizations(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null,
  price             bigint not null check (price > 0),
  description       text not null default '',
  category          text not null default 'Boutique',
  image_url         text not null,
  whatsapp_count    integer not null default 0,
  tiktok_count      integer not null default 0,
  facebook_count    integer not null default 0,
  last_published_at timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists idx_social_products_org_created
  on public.social_products(org_id, created_at desc);

alter table public.social_products enable row level security;

drop policy if exists "social_products_select_org" on public.social_products;
create policy "social_products_select_org"
  on public.social_products for select
  to authenticated
  using (public.has_org_role(org_id) or public.is_platform_admin());

drop policy if exists "social_products_insert_org" on public.social_products;
create policy "social_products_insert_org"
  on public.social_products for insert
  to authenticated
  with check (public.can_write(org_id) or public.is_platform_admin());

drop policy if exists "social_products_update_org" on public.social_products;
create policy "social_products_update_org"
  on public.social_products for update
  to authenticated
  using (public.can_write(org_id) or public.is_platform_admin())
  with check (public.can_write(org_id) or public.is_platform_admin());

drop policy if exists "social_products_delete_org" on public.social_products;
create policy "social_products_delete_org"
  on public.social_products for delete
  to authenticated
  using (public.can_write(org_id) or public.is_platform_admin());

-- Bucket Supabase Storage pour les photos des produits
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;

drop policy if exists "products_public_read" on storage.objects;
create policy "products_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'products');

drop policy if exists "products_auth_insert" on storage.objects;
create policy "products_auth_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'products');

drop policy if exists "products_auth_update" on storage.objects;
create policy "products_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'products');

drop policy if exists "products_auth_delete" on storage.objects;
create policy "products_auth_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'products');

