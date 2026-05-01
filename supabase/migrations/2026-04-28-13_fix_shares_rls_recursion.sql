-- =====================================================================
-- Migration : 2026-04-28 — Fix récursion RLS sur pages/qr_codes/shares
--
-- BUG : la migration 11 a créé des policies qui se référencent mutuellement.
--   - pages_select_public_or_member fait EXISTS sur page_shares
--   - page_shares_select_involved fait SELECT sur pages (workspace_id)
--   → Postgres détecte la récursion et bloque tout : "infinite recursion
--     detected in policy for relation pages".
--
-- FIX : on encapsule les checks dans des helpers SECURITY DEFINER (pattern
-- déjà appliqué pour is_workspace_member dans la migration 6) et on
-- supprime les sub-SELECT cross-table dans les policies.
-- Idempotent.
-- =====================================================================

-- ---------- 1) Helpers SECURITY DEFINER ----------

create or replace function public.is_page_shared_with_me(p_page_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.page_shares
    where page_id = p_page_id
      and shared_with_user_id = auth.uid()
  );
$$;

create or replace function public.is_qr_shared_with_me(p_qr_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.qr_shares
    where qr_id = p_qr_id
      and shared_with_user_id = auth.uid()
  );
$$;

create or replace function public.get_page_workspace_id(p_page_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id from public.pages where id = p_page_id;
$$;

create or replace function public.get_qr_workspace_id(p_qr_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id from public.qr_codes where id = p_qr_id;
$$;

grant execute on function public.is_page_shared_with_me(uuid) to authenticated;
grant execute on function public.is_qr_shared_with_me(uuid) to authenticated;
grant execute on function public.get_page_workspace_id(uuid) to authenticated;
grant execute on function public.get_qr_workspace_id(uuid) to authenticated;

-- ---------- 2) pages : recréer la policy SELECT sans récursion ----------

drop policy if exists "pages_select_public_or_member" on public.pages;
create policy "pages_select_public_or_member" on public.pages
  for select using (
    is_published = true
    or public.is_workspace_member(workspace_id)
    or public.is_page_shared_with_me(id)
  );

-- ---------- 3) qr_codes : recréer la policy SELECT sans récursion ----------

drop policy if exists "qr_codes_select_member" on public.qr_codes;
create policy "qr_codes_select_member" on public.qr_codes
  for select using (
    public.is_workspace_member(workspace_id)
    or public.is_qr_shared_with_me(id)
  );

-- ---------- 4) page_shares : recréer SELECT/INSERT/DELETE sans sub-SELECT ----------

drop policy if exists "page_shares_select_involved" on public.page_shares;
create policy "page_shares_select_involved" on public.page_shares
  for select using (
    auth.uid() = shared_with_user_id
    or auth.uid() = shared_by_user_id
    or public.is_workspace_member(public.get_page_workspace_id(page_id))
  );

drop policy if exists "page_shares_insert_member" on public.page_shares;
create policy "page_shares_insert_member" on public.page_shares
  for insert with check (
    auth.uid() = shared_by_user_id
    and public.has_workspace_role(
      public.get_page_workspace_id(page_id),
      array['owner', 'editor']
    )
  );

drop policy if exists "page_shares_delete_owner_or_recipient" on public.page_shares;
create policy "page_shares_delete_owner_or_recipient" on public.page_shares
  for delete using (
    auth.uid() = shared_with_user_id
    or public.has_workspace_role(
      public.get_page_workspace_id(page_id),
      array['owner', 'editor']
    )
  );

-- ---------- 5) qr_shares : pareil ----------

drop policy if exists "qr_shares_select_involved" on public.qr_shares;
create policy "qr_shares_select_involved" on public.qr_shares
  for select using (
    auth.uid() = shared_with_user_id
    or auth.uid() = shared_by_user_id
    or public.is_workspace_member(public.get_qr_workspace_id(qr_id))
  );

drop policy if exists "qr_shares_insert_member" on public.qr_shares;
create policy "qr_shares_insert_member" on public.qr_shares
  for insert with check (
    auth.uid() = shared_by_user_id
    and public.has_workspace_role(
      public.get_qr_workspace_id(qr_id),
      array['owner', 'editor']
    )
  );

drop policy if exists "qr_shares_delete_owner_or_recipient" on public.qr_shares;
create policy "qr_shares_delete_owner_or_recipient" on public.qr_shares
  for delete using (
    auth.uid() = shared_with_user_id
    or public.has_workspace_role(
      public.get_qr_workspace_id(qr_id),
      array['owner', 'editor']
    )
  );
