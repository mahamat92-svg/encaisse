-- Migration 0007 : Services Afrique + Page publique /decouvrir

alter table public.social_products
  add column if not exists city text not null default 'Ngaoundéré',
  add column if not exists shop_name text not null default '',
  add column if not exists whatsapp_phone text not null default '';

create index if not exists idx_social_products_city_category
  on public.social_products(city, category, created_at desc);

-- Permettre aux visiteurs publics sur /decouvrir de consulter les produits/services
drop policy if exists "social_products_select_org" on public.social_products;
drop policy if exists "social_products_public_read" on public.social_products;
create policy "social_products_public_read"
  on public.social_products for select
  to anon, authenticated
  using (true);

