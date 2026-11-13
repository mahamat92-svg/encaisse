-- Migration 0008 : Logo d'entreprise du vendeur sur les produits (/produits et /decouvrir)

alter table public.social_products
  add column if not exists shop_logo_url text not null default '';

