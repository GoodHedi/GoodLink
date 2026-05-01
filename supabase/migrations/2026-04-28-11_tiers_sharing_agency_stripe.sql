-- =====================================================================
-- Migration : 2026-04-28 — Tiers utilisateurs + agences + partage + Stripe
--
-- 1) Tier sur accounts : visiteur (par défaut) | pro | agence | agence_client
-- 2) Champs Stripe sur accounts
-- 3) Tables agency_codes + agency_clients
-- 4) Tables page_shares + qr_shares (+ fonction list_shared_with_me)
-- 5) RLS appropriées
--
-- IMPORTANT : les comptes EXISTANTS sont upgradés à 'pro' par grand-fathering
-- (il y a déjà des utilisateurs en prod qui ont créé pages/QR).
-- Idempotent.
-- =====================================================================

-- ---------- 1) tier sur accounts ----------

do $$ begin
  if not exists (select 1 from pg_type where typname = 'account_tier') then
    create type public.account_tier as enum (
      'visiteur', 'pro', 'agence', 'agence_client'
    );
  end if;
end $$;

alter table public.accounts
  add column if not exists tier public.account_tier not null default 'visiteur';

-- Grand-fathering : tout compte qui existe déjà avant cette migration
-- passe à 'pro' (sinon ils vont tomber sous la limite 1-page Visiteur).
update public.accounts
set tier = 'pro'
where tier = 'visiteur';

-- ---------- 2) champs Stripe sur accounts ----------

alter table public.accounts
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists tier_expires_at timestamptz;

create index if not exists accounts_stripe_customer_id_idx
  on public.accounts (stripe_customer_id);

-- ---------- 3) Codes agence ----------

create table if not exists public.agency_codes (
  id uuid primary key default gen_random_uuid(),
  agency_account_id uuid not null references public.accounts(id) on delete cascade,
  code text not null unique,
  label text not null default '',
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists agency_codes_agency_idx
  on public.agency_codes (agency_account_id, created_at desc);

create table if not exists public.agency_clients (
  agency_account_id uuid not null references public.accounts(id) on delete cascade,
  client_account_id uuid not null references public.accounts(id) on delete cascade,
  code_id uuid not null references public.agency_codes(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (agency_account_id, client_account_id)
);

create index if not exists agency_clients_client_idx
  on public.agency_clients (client_account_id);

-- ---------- 4) Partage de pages et QR ----------

create table if not exists public.page_shares (
  page_id uuid not null references public.pages(id) on delete cascade,
  shared_with_user_id uuid not null references auth.users(id) on delete cascade,
  shared_by_user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer', 'editor')),
  created_at timestamptz not null default now(),
  primary key (page_id, shared_with_user_id)
);

create index if not exists page_shares_user_idx
  on public.page_shares (shared_with_user_id, created_at desc);

create table if not exists public.qr_shares (
  qr_id uuid not null references public.qr_codes(id) on delete cascade,
  shared_with_user_id uuid not null references auth.users(id) on delete cascade,
  shared_by_user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer', 'editor')),
  created_at timestamptz not null default now(),
  primary key (qr_id, shared_with_user_id)
);

create index if not exists qr_shares_user_idx
  on public.qr_shares (shared_with_user_id, created_at desc);

-- ---------- 5) RLS ----------

alter table public.agency_codes enable row level security;
alter table public.agency_clients enable row level security;
alter table public.page_shares enable row level security;
alter table public.qr_shares enable row level security;

-- agency_codes : l'agence voit/crée/révoque ses propres codes
drop policy if exists "agency_codes_select_own" on public.agency_codes;
create policy "agency_codes_select_own" on public.agency_codes
  for select using (auth.uid() = agency_account_id);

drop policy if exists "agency_codes_insert_own" on public.agency_codes;
create policy "agency_codes_insert_own" on public.agency_codes
  for insert with check (auth.uid() = agency_account_id);

drop policy if exists "agency_codes_update_own" on public.agency_codes;
create policy "agency_codes_update_own" on public.agency_codes
  for update using (auth.uid() = agency_account_id)
  with check (auth.uid() = agency_account_id);

drop policy if exists "agency_codes_delete_own" on public.agency_codes;
create policy "agency_codes_delete_own" on public.agency_codes
  for delete using (auth.uid() = agency_account_id);

-- agency_clients : l'agence voit ses clients ; le client voit son agence
drop policy if exists "agency_clients_select_own" on public.agency_clients;
create policy "agency_clients_select_own" on public.agency_clients
  for select using (
    auth.uid() = agency_account_id or auth.uid() = client_account_id
  );

-- INSERT/DELETE via RPC SECURITY DEFINER (activate / revoke)
-- Pas de policy direct insert/delete -> les opérations passent par RPC.

-- page_shares
drop policy if exists "page_shares_select_involved" on public.page_shares;
create policy "page_shares_select_involved" on public.page_shares
  for select using (
    auth.uid() = shared_with_user_id
    or auth.uid() = shared_by_user_id
    or public.is_workspace_member(
        (select workspace_id from public.pages where id = page_id)
      )
  );

drop policy if exists "page_shares_insert_member" on public.page_shares;
create policy "page_shares_insert_member" on public.page_shares
  for insert with check (
    auth.uid() = shared_by_user_id
    and public.has_workspace_role(
      (select workspace_id from public.pages where id = page_id),
      array['owner', 'editor']
    )
  );

drop policy if exists "page_shares_delete_owner_or_recipient" on public.page_shares;
create policy "page_shares_delete_owner_or_recipient" on public.page_shares
  for delete using (
    auth.uid() = shared_with_user_id
    or public.has_workspace_role(
      (select workspace_id from public.pages where id = page_id),
      array['owner', 'editor']
    )
  );

-- qr_shares (mêmes règles, scoped au workspace du QR)
drop policy if exists "qr_shares_select_involved" on public.qr_shares;
create policy "qr_shares_select_involved" on public.qr_shares
  for select using (
    auth.uid() = shared_with_user_id
    or auth.uid() = shared_by_user_id
    or public.is_workspace_member(
        (select workspace_id from public.qr_codes where id = qr_id)
      )
  );

drop policy if exists "qr_shares_insert_member" on public.qr_shares;
create policy "qr_shares_insert_member" on public.qr_shares
  for insert with check (
    auth.uid() = shared_by_user_id
    and public.has_workspace_role(
      (select workspace_id from public.qr_codes where id = qr_id),
      array['owner', 'editor']
    )
  );

drop policy if exists "qr_shares_delete_owner_or_recipient" on public.qr_shares;
create policy "qr_shares_delete_owner_or_recipient" on public.qr_shares
  for delete using (
    auth.uid() = shared_with_user_id
    or public.has_workspace_role(
      (select workspace_id from public.qr_codes where id = qr_id),
      array['owner', 'editor']
    )
  );

-- Élargir la lecture des pages aux destinataires de partages
drop policy if exists "pages_select_public_or_member" on public.pages;
create policy "pages_select_public_or_member" on public.pages
  for select using (
    is_published = true
    or public.is_workspace_member(workspace_id)
    or exists (
      select 1 from public.page_shares
      where page_shares.page_id = pages.id
        and page_shares.shared_with_user_id = auth.uid()
    )
  );

-- Élargir la lecture des QR aux destinataires de partages
drop policy if exists "qr_codes_select_member" on public.qr_codes;
create policy "qr_codes_select_member" on public.qr_codes
  for select using (
    public.is_workspace_member(workspace_id)
    or exists (
      select 1 from public.qr_shares
      where qr_shares.qr_id = qr_codes.id
        and qr_shares.shared_with_user_id = auth.uid()
    )
  );

-- ---------- 6) Helper de désactivation des cards d'un agence_client ----------
-- Quand une agence révoque un code, les comptes qui l'avaient utilisé
-- redeviennent 'visiteur' et leurs pages publiques cessent d'être publiées.

create or replace function public.revoke_agency_code(p_code_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agency_id uuid;
  v_clients uuid[];
  v_count int := 0;
begin
  -- Auth : l'appelant doit être l'agence propriétaire du code
  select agency_account_id into v_agency_id
  from public.agency_codes
  where id = p_code_id;

  if v_agency_id is null then
    raise exception 'Code introuvable.';
  end if;
  if v_agency_id <> auth.uid() then
    raise exception 'Pas autorisé.';
  end if;

  -- Marque le code révoqué
  update public.agency_codes
  set revoked_at = now()
  where id = p_code_id and revoked_at is null;

  -- Liste les clients liés à ce code
  select array_agg(client_account_id) into v_clients
  from public.agency_clients
  where code_id = p_code_id;

  if v_clients is null then
    return 0;
  end if;

  v_count := array_length(v_clients, 1);

  -- Downgrade les clients
  update public.accounts
  set tier = 'visiteur'
  where id = any(v_clients) and tier = 'agence_client';

  -- Dépublie leurs pages
  update public.pages
  set is_published = false
  where owner_id = any(v_clients);

  -- Drop la liaison agency_clients (nettoyage)
  delete from public.agency_clients where code_id = p_code_id;

  return v_count;
end;
$$;

grant execute on function public.revoke_agency_code(uuid) to authenticated;

-- ---------- 7) Activation via code agence ----------

create or replace function public.activate_agency_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code record;
  v_existing public.account_tier;
begin
  if v_uid is null then
    raise exception 'Pas connecté.';
  end if;

  select * into v_code
  from public.agency_codes
  where code = p_code and revoked_at is null;
  if v_code is null then
    raise exception 'Code invalide ou révoqué.';
  end if;

  -- Une agence ne peut pas être client d'une autre agence
  select tier into v_existing from public.accounts where id = v_uid;
  if v_existing = 'agence' then
    raise exception 'Un compte agence ne peut pas activer un code agence.';
  end if;

  -- Lie + upgrade
  insert into public.agency_clients (agency_account_id, client_account_id, code_id)
  values (v_code.agency_account_id, v_uid, v_code.id)
  on conflict (agency_account_id, client_account_id) do nothing;

  update public.accounts
  set tier = 'agence_client'
  where id = v_uid;

  return v_code.agency_account_id;
end;
$$;

grant execute on function public.activate_agency_code(text) to authenticated;
