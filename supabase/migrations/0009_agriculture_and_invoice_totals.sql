-- Migration 0009 : Agriculture & Élevage (stock, unité, marché, date de récolte, sous-catégorie)
alter table if exists public.social_products
  add column if not exists sub_category text not null default '',
  add column if not exists agri_type text not null default '',
  add column if not exists unit text not null default '',
  add column if not exists stock_qty numeric(12,2) not null default 0,
  add column if not exists sold_qty numeric(12,2) not null default 0,
  add column if not exists market_name text not null default '',
  add column if not exists harvest_date text not null default '';

