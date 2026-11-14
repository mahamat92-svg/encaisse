-- Migration 0011 : Lien Facebook client + Soldes Mobile Money & Carte Bancaire
alter table if exists public.clients
  add column if not exists facebook_url text not null default '',
  add column if not exists mobile_money_balance bigint not null default 0,
  add column if not exists bank_card_balance bigint not null default 0;
