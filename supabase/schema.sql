-- =====================================================================
-- GoodLink — Schéma initial
-- À exécuter dans le SQL Editor de Supabase :
--   1. Project > SQL Editor > New query
--   2. Coller ce fichier dans son intégralité
--   3. Run
-- Le script est idempotent : peut être ré-exécuté sans rien casser.
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists pgcrypto;

-- ---------- Tables ----------

-- profiles : un profil par utilisateur authentifié
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text not null default '',
  bio text,
  avatar_url text,
  background_url text,
  background_color text not null default '#F3EFE9',
  -- Opacité de l'overlay noir appliqué quand une image de fond est utilisée (0-1)
  background_overlay numeric not null default 0.3
    check (background_overlay >= 0 and background_overlay <= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format
    check (username ~ '^[a-z0-9-]{3,20}$'),
  constraint bio_length
    check (bio is null or char_length(bio) <= 160)
);

-- Unicité du username (lowercase déjà garanti par le check format)
create unique index if not exists profiles_username_key
  on public.profiles (username);

-- links : liens d'un profil, ordonnés par `position`
create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  url text not null check (char_length(url) between 1 and 2048),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists links_profile_id_position_idx
  on public.links (profile_id, position);

-- ---------- Triggers ----------

-- Maintien de updated_at sur profiles
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Création automatique d'un profil à l'inscription.
-- Le username est passé via supabase.auth.signUp({ options: { data: { username } } }).
-- SECURITY DEFINER pour pouvoir écrire dans public.profiles depuis auth.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  v_username := lower(coalesce(new.raw_user_meta_data->>'username', ''));
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    v_username,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), v_username)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row Level Security ----------

alter table public.profiles enable row level security;
alter table public.links enable row level security;

-- profiles : lecture publique, écriture par le propriétaire uniquement
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- links : lecture publique, écriture par le propriétaire du profile uniquement
-- Comme profile_id = auth.users.id (via profiles.id), on peut comparer directement.
drop policy if exists "links_select_public" on public.links;
create policy "links_select_public" on public.links
  for select using (true);

drop policy if exists "links_insert_own" on public.links;
create policy "links_insert_own" on public.links
  for insert with check (auth.uid() = profile_id);

drop policy if exists "links_update_own" on public.links;
create policy "links_update_own" on public.links
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

drop policy if exists "links_delete_own" on public.links;
create policy "links_delete_own" on public.links
  for delete using (auth.uid() = profile_id);

-- ---------- Storage ----------
-- Deux buckets publics. Convention : chaque utilisateur écrit uniquement dans
-- un dossier qui porte son uuid : `<auth.uid()>/...`.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('backgrounds', 'backgrounds', true)
on conflict (id) do nothing;

-- Avatars
drop policy if exists "avatars_read_public" on storage.objects;
create policy "avatars_read_public" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Backgrounds
drop policy if exists "backgrounds_read_public" on storage.objects;
create policy "backgrounds_read_public" on storage.objects
  for select using (bucket_id = 'backgrounds');

drop policy if exists "backgrounds_insert_own" on storage.objects;
create policy "backgrounds_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'backgrounds'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "backgrounds_update_own" on storage.objects;
create policy "backgrounds_update_own" on storage.objects
  for update using (
    bucket_id = 'backgrounds'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "backgrounds_delete_own" on storage.objects;
create policy "backgrounds_delete_own" on storage.objects
  for delete using (
    bucket_id = 'backgrounds'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
