-- =====================================================================
-- MIGRATION 0004 : TABLE subscriptions (7 jours d'essai gratuit) & SIGNUP
-- =====================================================================

-- 1. Table 'subscriptions' (un abonnement par utilisateur)
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

-- 2. Trigger automatique : chaque nouvel inscrit reçoit 7 jours d'essai gratuit
create or replace function public.handle_new_user_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (user_id, plan, status, expires_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'plan', 'pro'),
    'trial',
    now() + interval '7 days'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_subscription on auth.users;
create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute function public.handle_new_user_subscription();

