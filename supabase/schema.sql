-- =====================================================================
-- GoodLink — Schéma v2 (multi-page + types liens + analytics + QR codes)
--
-- ⚠️ MIGRATION DESTRUCTIVE : drop des tables v1 (profiles, links).
-- Ne garde que les comptes auth.users — les liens et profils v1 sont perdus.
-- À exécuter une seule fois dans le SQL Editor de Supabase.
--
-- Le reste du fichier est idempotent (tu peux le rejouer si besoin).
-- =====================================================================

-- ---------- Drop v1 ----------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.links cascade;
drop table if exists public.profiles cascade;

-- ---------- Extensions ----------
create extension if not exists pgcrypto;

-- =====================================================================
-- Tables
-- =====================================================================

-- pages : 1 page = 1 lien public goodlink. 1 utilisateur en a entre 1 et N.
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  display_name text not null default '',
  bio text,
  avatar_url text,
  background_url text,
  background_color text not null default '#F3EFE9',
  background_overlay numeric not null default 0.3
    check (background_overlay >= 0 and background_overlay <= 1),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9-]{3,20}$'),
  constraint bio_length check (bio is null or char_length(bio) <= 160)
);

create unique index if not exists pages_username_key on public.pages (username);
create index if not exists pages_owner_id_idx on public.pages (owner_id);

-- links : avec type pour vague 2 (link/header/social)
create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  type text not null default 'link'
    check (type in ('link', 'header', 'social')),
  title text not null check (char_length(title) between 1 and 80),
  url text not null default '' check (char_length(url) <= 2048),
  platform text, -- pour type='social' : 'instagram', 'tiktok', etc.
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists links_page_id_position_idx
  on public.links (page_id, position);

-- page_views : 1 ligne par visite de page publique (vague 3)
create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  page_id uuid not null references public.pages(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists page_views_page_id_idx
  on public.page_views (page_id, viewed_at desc);

-- link_clicks : 1 ligne par clic sur un lien (vague 3)
create table if not exists public.link_clicks (
  id bigint generated always as identity primary key,
  link_id uuid not null references public.links(id) on delete cascade,
  clicked_at timestamptz not null default now()
);

create index if not exists link_clicks_link_id_idx
  on public.link_clicks (link_id, clicked_at desc);

-- qr_codes : feature séparée, attachée à un user (vague 4)
create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  target_url text not null check (char_length(target_url) between 1 and 2048),
  fg_color text not null default '#0F291E',
  bg_color text not null default '#FFFFFF',
  created_at timestamptz not null default now()
);

create index if not exists qr_codes_owner_id_idx
  on public.qr_codes (owner_id, created_at desc);

-- =====================================================================
-- Triggers
-- =====================================================================

-- Maintien updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pages_set_updated_at on public.pages;
create trigger pages_set_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

-- Création automatique de la 1ère page à l'inscription
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
  if v_username = '' then
    return new;
  end if;
  insert into public.pages (owner_id, username, display_name)
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

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.pages enable row level security;
alter table public.links enable row level security;
alter table public.page_views enable row level security;
alter table public.link_clicks enable row level security;
alter table public.qr_codes enable row level security;

-- pages : lecture publique (uniquement les pages publiées), écriture par owner
drop policy if exists "pages_select_public_or_own" on public.pages;
create policy "pages_select_public_or_own" on public.pages
  for select using (is_published = true or auth.uid() = owner_id);

drop policy if exists "pages_insert_own" on public.pages;
create policy "pages_insert_own" on public.pages
  for insert with check (auth.uid() = owner_id);

drop policy if exists "pages_update_own" on public.pages;
create policy "pages_update_own" on public.pages
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "pages_delete_own" on public.pages;
create policy "pages_delete_own" on public.pages
  for delete using (auth.uid() = owner_id);

-- links : lecture publique, écriture via la jointure pages
drop policy if exists "links_select_public" on public.links;
create policy "links_select_public" on public.links
  for select using (true);

drop policy if exists "links_insert_own" on public.links;
create policy "links_insert_own" on public.links
  for insert with check (
    auth.uid() = (select owner_id from public.pages where id = page_id)
  );

drop policy if exists "links_update_own" on public.links;
create policy "links_update_own" on public.links
  for update using (
    auth.uid() = (select owner_id from public.pages where id = page_id)
  ) with check (
    auth.uid() = (select owner_id from public.pages where id = page_id)
  );

drop policy if exists "links_delete_own" on public.links;
create policy "links_delete_own" on public.links
  for delete using (
    auth.uid() = (select owner_id from public.pages where id = page_id)
  );

-- page_views : insertion publique (n'importe qui peut enregistrer une vue),
-- lecture par owner uniquement
drop policy if exists "page_views_insert_public" on public.page_views;
create policy "page_views_insert_public" on public.page_views
  for insert with check (true);

drop policy if exists "page_views_select_own" on public.page_views;
create policy "page_views_select_own" on public.page_views
  for select using (
    auth.uid() = (select owner_id from public.pages where id = page_id)
  );

-- link_clicks : insertion publique, lecture par owner via pages
drop policy if exists "link_clicks_insert_public" on public.link_clicks;
create policy "link_clicks_insert_public" on public.link_clicks
  for insert with check (true);

drop policy if exists "link_clicks_select_own" on public.link_clicks;
create policy "link_clicks_select_own" on public.link_clicks
  for select using (
    auth.uid() = (
      select p.owner_id from public.pages p
      join public.links l on l.page_id = p.id
      where l.id = link_id
    )
  );

-- qr_codes : owner uniquement, jamais public
drop policy if exists "qr_codes_select_own" on public.qr_codes;
create policy "qr_codes_select_own" on public.qr_codes
  for select using (auth.uid() = owner_id);

drop policy if exists "qr_codes_insert_own" on public.qr_codes;
create policy "qr_codes_insert_own" on public.qr_codes
  for insert with check (auth.uid() = owner_id);

drop policy if exists "qr_codes_update_own" on public.qr_codes;
create policy "qr_codes_update_own" on public.qr_codes
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "qr_codes_delete_own" on public.qr_codes;
create policy "qr_codes_delete_own" on public.qr_codes
  for delete using (auth.uid() = owner_id);

-- =====================================================================
-- Storage (avatars + backgrounds, inchangé)
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true) on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('backgrounds', 'backgrounds', true) on conflict (id) do nothing;

drop policy if exists "avatars_read_public" on storage.objects;
create policy "avatars_read_public" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "backgrounds_read_public" on storage.objects;
create policy "backgrounds_read_public" on storage.objects
  for select using (bucket_id = 'backgrounds');

drop policy if exists "backgrounds_insert_own" on storage.objects;
create policy "backgrounds_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'backgrounds' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "backgrounds_update_own" on storage.objects;
create policy "backgrounds_update_own" on storage.objects
  for update using (
    bucket_id = 'backgrounds' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "backgrounds_delete_own" on storage.objects;
create policy "backgrounds_delete_own" on storage.objects
  for delete using (
    bucket_id = 'backgrounds' and auth.uid()::text = (storage.foldername(name))[1]
  );
