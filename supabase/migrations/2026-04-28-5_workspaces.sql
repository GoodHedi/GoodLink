-- =====================================================================
-- Migration : 2026-04-28 — Workspaces collaboratifs
--
-- - workspaces (1 user peut être membre de N, et créateur de N)
-- - workspace_members (rôle owner/editor/viewer)
-- - workspace_invites (lien d'invitation token-based)
-- - pages.workspace_id, qr_codes.workspace_id
-- - Backfill : workspace personnel auto pour chaque user existant
-- - RLS pages/qr_codes basée sur workspace_members (au lieu de owner_id)
-- - Trigger handle_new_user crée aussi un workspace personnel
-- Idempotent (sécurisée via if not exists / drop policy if exists).
-- =====================================================================

create extension if not exists pgcrypto;

-- Enum role
do $$ begin
  if not exists (select 1 from pg_type where typname = 'workspace_role') then
    create type workspace_role as enum ('owner', 'editor', 'viewer');
  end if;
end $$;

-- ---------- Tables ----------

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  created_by uuid not null references auth.users(id) on delete cascade,
  is_personal boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists workspaces_created_by_idx on public.workspaces (created_by);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role workspace_role not null default 'editor',
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index if not exists workspace_members_user_id_idx on public.workspace_members (user_id);

create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role workspace_role not null default 'editor',
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists workspace_invites_workspace_id_idx on public.workspace_invites (workspace_id);
create index if not exists workspace_invites_token_idx on public.workspace_invites (token);

-- ---------- Lien pages/qr_codes -> workspace ----------

alter table public.pages
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.qr_codes
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

-- ---------- Backfill ----------

do $$
declare
  u_id uuid;
  ws_id uuid;
begin
  for u_id in (
    select distinct owner_id from (
      select owner_id from public.pages
      union
      select owner_id from public.qr_codes
    ) all_owners
    where owner_id is not null
  ) loop
    select id into ws_id from public.workspaces
      where created_by = u_id and is_personal = true
      limit 1;

    if ws_id is null then
      insert into public.workspaces (name, created_by, is_personal)
        values ('Personnel', u_id, true)
        returning id into ws_id;

      insert into public.workspace_members (workspace_id, user_id, role)
        values (ws_id, u_id, 'owner')
        on conflict do nothing;
    end if;

    update public.pages
      set workspace_id = ws_id
      where owner_id = u_id and workspace_id is null;

    update public.qr_codes
      set workspace_id = ws_id
      where owner_id = u_id and workspace_id is null;
  end loop;
end $$;

-- Pose le NOT NULL si le backfill est complet
do $$
begin
  if not exists (select 1 from public.pages where workspace_id is null) then
    alter table public.pages alter column workspace_id set not null;
  end if;
  if not exists (select 1 from public.qr_codes where workspace_id is null) then
    alter table public.qr_codes alter column workspace_id set not null;
  end if;
end $$;

create index if not exists pages_workspace_id_idx on public.pages (workspace_id);
create index if not exists qr_codes_workspace_id_idx on public.qr_codes (workspace_id);

-- ---------- Row Level Security ----------

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invites enable row level security;

-- workspaces
drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member" on public.workspaces
  for select using (
    id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );

drop policy if exists "workspaces_insert_self" on public.workspaces;
create policy "workspaces_insert_self" on public.workspaces
  for insert with check (auth.uid() = created_by);

drop policy if exists "workspaces_update_owner" on public.workspaces;
create policy "workspaces_update_owner" on public.workspaces
  for update using (
    id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role = 'owner')
  ) with check (
    id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role = 'owner')
  );

drop policy if exists "workspaces_delete_owner" on public.workspaces;
create policy "workspaces_delete_owner" on public.workspaces
  for delete using (
    id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role = 'owner')
  );

-- workspace_members
drop policy if exists "members_select_same_workspace" on public.workspace_members;
create policy "members_select_same_workspace" on public.workspace_members
  for select using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );

-- L'INSERT autorisé soit pour soi-même (accept-invite),
-- soit par le owner du workspace
drop policy if exists "members_insert_self_or_owner" on public.workspace_members;
create policy "members_insert_self_or_owner" on public.workspace_members
  for insert with check (
    user_id = auth.uid()
    or workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid() and role = 'owner'
    )
  );

drop policy if exists "members_delete_owner_or_self" on public.workspace_members;
create policy "members_delete_owner_or_self" on public.workspace_members
  for delete using (
    user_id = auth.uid()
    or workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid() and role = 'owner'
    )
  );

drop policy if exists "members_update_role_owner" on public.workspace_members;
create policy "members_update_role_owner" on public.workspace_members
  for update using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role = 'owner')
  );

-- workspace_invites : visibles par owner uniquement
drop policy if exists "invites_select_owner" on public.workspace_invites;
create policy "invites_select_owner" on public.workspace_invites
  for select using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role = 'owner')
  );

drop policy if exists "invites_insert_owner" on public.workspace_invites;
create policy "invites_insert_owner" on public.workspace_invites
  for insert with check (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role = 'owner')
  );

drop policy if exists "invites_update_owner_or_acceptor" on public.workspace_invites;
create policy "invites_update_owner_or_acceptor" on public.workspace_invites
  for update using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role = 'owner')
    or accepted_by = auth.uid()
  );

drop policy if exists "invites_delete_owner" on public.workspace_invites;
create policy "invites_delete_owner" on public.workspace_invites
  for delete using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role = 'owner')
  );

-- pages : on remplace l'access par workspace membership
drop policy if exists "pages_select_public_or_own" on public.pages;
drop policy if exists "pages_select_public_or_member" on public.pages;
create policy "pages_select_public_or_member" on public.pages
  for select using (
    is_published = true
    or workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );

drop policy if exists "pages_insert_own" on public.pages;
drop policy if exists "pages_insert_member" on public.pages;
create policy "pages_insert_member" on public.pages
  for insert with check (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner','editor'))
  );

drop policy if exists "pages_update_own" on public.pages;
drop policy if exists "pages_update_member" on public.pages;
create policy "pages_update_member" on public.pages
  for update using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner','editor'))
  ) with check (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner','editor'))
  );

drop policy if exists "pages_delete_own" on public.pages;
drop policy if exists "pages_delete_member" on public.pages;
create policy "pages_delete_member" on public.pages
  for delete using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner','editor'))
  );

-- qr_codes
drop policy if exists "qr_codes_select_own" on public.qr_codes;
drop policy if exists "qr_codes_select_member" on public.qr_codes;
create policy "qr_codes_select_member" on public.qr_codes
  for select using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
  );

drop policy if exists "qr_codes_insert_own" on public.qr_codes;
drop policy if exists "qr_codes_insert_member" on public.qr_codes;
create policy "qr_codes_insert_member" on public.qr_codes
  for insert with check (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner','editor'))
  );

drop policy if exists "qr_codes_update_own" on public.qr_codes;
drop policy if exists "qr_codes_update_member" on public.qr_codes;
create policy "qr_codes_update_member" on public.qr_codes
  for update using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner','editor'))
  ) with check (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner','editor'))
  );

drop policy if exists "qr_codes_delete_own" on public.qr_codes;
drop policy if exists "qr_codes_delete_member" on public.qr_codes;
create policy "qr_codes_delete_member" on public.qr_codes
  for delete using (
    workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid() and role in ('owner','editor'))
  );

-- ---------- RPC : acceptation d'une invitation par token ----------
-- SECURITY DEFINER pour pouvoir lire/écrire les invitations et members
-- même si l'utilisateur n'est pas (encore) membre du workspace.
-- Renvoie le workspace_id sur succès, NULL si invitation invalide/expirée.

create or replace function public.accept_workspace_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'invalid: not authenticated';
  end if;

  select * into v_invite
  from public.workspace_invites
  where token = p_token
  limit 1;

  if v_invite is null then
    raise exception 'invalid: not found';
  end if;
  if v_invite.accepted_at is not null then
    raise exception 'already: accepted';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'expired';
  end if;

  -- Déjà membre ?
  if exists (
    select 1 from public.workspace_members
    where workspace_id = v_invite.workspace_id and user_id = v_user_id
  ) then
    -- On marque l'invite comme acceptée pour le clean
    update public.workspace_invites
      set accepted_at = now(), accepted_by = v_user_id
      where id = v_invite.id;
    return v_invite.workspace_id;
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_invite.workspace_id, v_user_id, v_invite.role);

  update public.workspace_invites
    set accepted_at = now(), accepted_by = v_user_id
    where id = v_invite.id;

  return v_invite.workspace_id;
end;
$$;

grant execute on function public.accept_workspace_invite(text) to authenticated;

-- ---------- Trigger : signup crée le workspace personnel ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_age int;
  v_ws_id uuid;
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

  insert into public.workspaces (name, created_by, is_personal)
  values ('Personnel', new.id, true)
  returning id into v_ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_ws_id, new.id, 'owner')
  on conflict do nothing;

  return new;
end;
$$;
