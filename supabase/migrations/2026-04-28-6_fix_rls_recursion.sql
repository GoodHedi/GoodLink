-- =====================================================================
-- Migration : 2026-04-28 — Fix récursion RLS sur workspace_members
--
-- Le problème : les policies sur workspace_members faisaient un sub-SELECT
-- sur la même table, qui re-déclenchait la policy RLS, etc. Postgres
-- bloque silencieusement → tout casse (pages, qr_codes, workspaces
-- inaccessibles, création impossible).
--
-- Le fix standard : encapsuler le check dans des fonctions
-- SECURITY DEFINER (= bypass RLS) et utiliser ces fonctions dans les
-- policies à la place du sub-SELECT.
-- Idempotent.
-- =====================================================================

-- ---------- Helpers SECURITY DEFINER ----------

create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(
  ws_id uuid,
  allowed text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
      and role::text = any(allowed)
  );
$$;

grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.has_workspace_role(uuid, text[]) to authenticated;

-- ---------- workspace_members : policies sans récursion ----------

drop policy if exists "members_select_same_workspace" on public.workspace_members;
create policy "members_select_same_workspace" on public.workspace_members
  for select using (
    user_id = auth.uid()
    or public.is_workspace_member(workspace_id)
  );

drop policy if exists "members_insert_self_or_owner" on public.workspace_members;
create policy "members_insert_self_or_owner" on public.workspace_members
  for insert with check (
    user_id = auth.uid()
    or public.has_workspace_role(workspace_id, array['owner'])
  );

drop policy if exists "members_delete_owner_or_self" on public.workspace_members;
create policy "members_delete_owner_or_self" on public.workspace_members
  for delete using (
    user_id = auth.uid()
    or public.has_workspace_role(workspace_id, array['owner'])
  );

drop policy if exists "members_update_role_owner" on public.workspace_members;
create policy "members_update_role_owner" on public.workspace_members
  for update using (public.has_workspace_role(workspace_id, array['owner']));

-- ---------- workspaces ----------

drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member" on public.workspaces
  for select using (public.is_workspace_member(id));

drop policy if exists "workspaces_insert_self" on public.workspaces;
create policy "workspaces_insert_self" on public.workspaces
  for insert with check (auth.uid() = created_by);

drop policy if exists "workspaces_update_owner" on public.workspaces;
create policy "workspaces_update_owner" on public.workspaces
  for update using (public.has_workspace_role(id, array['owner']))
  with check (public.has_workspace_role(id, array['owner']));

drop policy if exists "workspaces_delete_owner" on public.workspaces;
create policy "workspaces_delete_owner" on public.workspaces
  for delete using (public.has_workspace_role(id, array['owner']));

-- ---------- workspace_invites ----------

drop policy if exists "invites_select_owner" on public.workspace_invites;
create policy "invites_select_owner" on public.workspace_invites
  for select using (public.has_workspace_role(workspace_id, array['owner']));

drop policy if exists "invites_insert_owner" on public.workspace_invites;
create policy "invites_insert_owner" on public.workspace_invites
  for insert with check (public.has_workspace_role(workspace_id, array['owner']));

drop policy if exists "invites_update_owner_or_acceptor" on public.workspace_invites;
create policy "invites_update_owner_or_acceptor" on public.workspace_invites
  for update using (
    public.has_workspace_role(workspace_id, array['owner'])
    or accepted_by = auth.uid()
  );

drop policy if exists "invites_delete_owner" on public.workspace_invites;
create policy "invites_delete_owner" on public.workspace_invites
  for delete using (public.has_workspace_role(workspace_id, array['owner']));

-- ---------- pages ----------

drop policy if exists "pages_select_public_or_member" on public.pages;
create policy "pages_select_public_or_member" on public.pages
  for select using (
    is_published = true
    or public.is_workspace_member(workspace_id)
  );

drop policy if exists "pages_insert_member" on public.pages;
create policy "pages_insert_member" on public.pages
  for insert with check (
    public.has_workspace_role(workspace_id, array['owner', 'editor'])
  );

drop policy if exists "pages_update_member" on public.pages;
create policy "pages_update_member" on public.pages
  for update using (
    public.has_workspace_role(workspace_id, array['owner', 'editor'])
  ) with check (
    public.has_workspace_role(workspace_id, array['owner', 'editor'])
  );

drop policy if exists "pages_delete_member" on public.pages;
create policy "pages_delete_member" on public.pages
  for delete using (
    public.has_workspace_role(workspace_id, array['owner', 'editor'])
  );

-- ---------- qr_codes ----------

drop policy if exists "qr_codes_select_member" on public.qr_codes;
create policy "qr_codes_select_member" on public.qr_codes
  for select using (public.is_workspace_member(workspace_id));

drop policy if exists "qr_codes_insert_member" on public.qr_codes;
create policy "qr_codes_insert_member" on public.qr_codes
  for insert with check (
    public.has_workspace_role(workspace_id, array['owner', 'editor'])
  );

drop policy if exists "qr_codes_update_member" on public.qr_codes;
create policy "qr_codes_update_member" on public.qr_codes
  for update using (
    public.has_workspace_role(workspace_id, array['owner', 'editor'])
  ) with check (
    public.has_workspace_role(workspace_id, array['owner', 'editor'])
  );

drop policy if exists "qr_codes_delete_member" on public.qr_codes;
create policy "qr_codes_delete_member" on public.qr_codes
  for delete using (
    public.has_workspace_role(workspace_id, array['owner', 'editor'])
  );
