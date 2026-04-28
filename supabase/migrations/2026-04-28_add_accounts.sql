-- =====================================================================
-- Migration : 2026-04-28 — Ajout de la table `accounts` (handle + âge)
--
-- À exécuter dans le SQL Editor de Supabase. Idempotente, additive,
-- aucune perte de données.
--
-- Avant : signup demandait un username = futur URL de page.
-- Après : signup demande un username de compte (handle), email, mot de
-- passe, âge — pas de création automatique de page.
-- =====================================================================

-- ---------- Table accounts ----------
create table if not exists public.accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  age int check (age is null or (age >= 13 and age <= 120)),
  created_at timestamptz not null default now(),
  constraint accounts_username_format check (username ~ '^[a-z0-9-]{3,20}$')
);

create unique index if not exists accounts_username_key
  on public.accounts (username);

-- RLS
alter table public.accounts enable row level security;

drop policy if exists "accounts_select_public" on public.accounts;
create policy "accounts_select_public" on public.accounts
  for select using (true);

drop policy if exists "accounts_update_own" on public.accounts;
create policy "accounts_update_own" on public.accounts
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "accounts_delete_own" on public.accounts;
create policy "accounts_delete_own" on public.accounts
  for delete using (auth.uid() = id);

-- ---------- Trigger : à l'inscription, créer un compte (pas de page) ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_age int;
begin
  v_username := lower(coalesce(new.raw_user_meta_data->>'username', ''));

  begin
    v_age := nullif(new.raw_user_meta_data->>'age', '')::int;
  exception when others then
    v_age := null;
  end;

  if v_username = '' then
    return new;
  end if;

  insert into public.accounts (id, username, age)
  values (new.id, v_username, v_age)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
