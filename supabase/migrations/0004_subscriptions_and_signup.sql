-- =====================================================================
-- MIGRATION 0004 : COLONNES merchant_settings (phone, city, region, country, address, business_type, plan, created_at)
--                  & TABLE subscriptions (7 jours d'essai gratuit)
-- =====================================================================

alter table public.merchant_settings
  add column if not exists phone text default '23566268503',
  add column if not exists city text default 'Ngaoundéré',
  add column if not exists region text default 'Adamawa',
  add column if not exists country text default 'Cameroun',
  add column if not exists address text,
  add column if not exists business_type text not null default 'boutique',
  add column if not exists plan text not null default 'trial',
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.subscriptions (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  plan        text not null default 'pro',
  status      text not null default 'trial' check (status in ('trial', 'active', 'expired')),
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_user_all on public.subscriptions;
create policy subscriptions_user_all on public.subscriptions
  for all to authenticated
  using (user_id = auth.uid() or public.is_platform_admin())
  with check (user_id = auth.uid() or public.is_platform_admin());
