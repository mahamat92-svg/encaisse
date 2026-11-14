-- Migration 0010 : Tables IA Agriculture (sans supprimer aucune table existante)

create table if not exists public.agriculture_champs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  village text not null default 'Ngaoundéré',
  culture text not null default 'Maïs',
  surface numeric(10,2) not null default 1,
  date_semis text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.agriculture_diagnostics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_url text not null default '',
  maladie text not null default '',
  gravite text not null default 'Modérée',
  traitement text not null default '',
  date timestamptz not null default now()
);

create table if not exists public.agriculture_conseils (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null default '',
  reponse text not null default '',
  date timestamptz not null default now()
);

alter table public.agriculture_champs enable row level security;
alter table public.agriculture_diagnostics enable row level security;
alter table public.agriculture_conseils enable row level security;

drop policy if exists "agri_champs_own" on public.agriculture_champs;
create policy "agri_champs_own" on public.agriculture_champs
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "agri_diag_own" on public.agriculture_diagnostics;
create policy "agri_diag_own" on public.agriculture_diagnostics
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "agri_conseils_own" on public.agriculture_conseils;
create policy "agri_conseils_own" on public.agriculture_conseils
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
