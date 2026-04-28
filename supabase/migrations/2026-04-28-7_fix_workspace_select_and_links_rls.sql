-- =====================================================================
-- Migration : 2026-04-28 — Fix création workspace + RLS links workspace-based
--
-- 1) Création workspace bloquée :
--    INSERT workspaces → RETURNING * filtré par SELECT RLS qui requiert
--    is_workspace_member(id). Au moment du RETURNING, l'utilisateur n'est
--    pas encore membre → 0 ligne renvoyée → action JS croit à un échec.
--    Fix : autoriser le creator à SELECT son workspace via OR.
--
-- 2) RLS links pas migrée vers workspace :
--    Les policies links héritaient du modèle multi-page V2 (check
--    pages.owner_id = auth.uid()). Pour la collaboration, un editor
--    doit pouvoir modifier les liens d'une page créée par un autre
--    membre. Fix : passer aux mêmes helpers has_workspace_role /
--    is_workspace_member.
-- Idempotent.
-- =====================================================================

-- ---------- 1) workspaces : creator peut toujours voir ses workspaces ----------

drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member" on public.workspaces
  for select using (
    auth.uid() = created_by
    or public.is_workspace_member(id)
  );

-- ---------- 2) links : RLS workspace-based ----------

drop policy if exists "links_select_public" on public.links;
create policy "links_select_public" on public.links
  for select using (true); -- liens lisibles publiquement (la page filtre déjà)

drop policy if exists "links_insert_own" on public.links;
drop policy if exists "links_insert_member" on public.links;
create policy "links_insert_member" on public.links
  for insert with check (
    public.has_workspace_role(
      (select workspace_id from public.pages where id = page_id),
      array['owner', 'editor']
    )
  );

drop policy if exists "links_update_own" on public.links;
drop policy if exists "links_update_member" on public.links;
create policy "links_update_member" on public.links
  for update using (
    public.has_workspace_role(
      (select workspace_id from public.pages where id = page_id),
      array['owner', 'editor']
    )
  ) with check (
    public.has_workspace_role(
      (select workspace_id from public.pages where id = page_id),
      array['owner', 'editor']
    )
  );

drop policy if exists "links_delete_own" on public.links;
drop policy if exists "links_delete_member" on public.links;
create policy "links_delete_member" on public.links
  for delete using (
    public.has_workspace_role(
      (select workspace_id from public.pages where id = page_id),
      array['owner', 'editor']
    )
  );

-- ---------- 3) page_views / link_clicks : lecture par owner via workspace ----------

drop policy if exists "page_views_select_own" on public.page_views;
create policy "page_views_select_own" on public.page_views
  for select using (
    public.is_workspace_member(
      (select workspace_id from public.pages where id = page_id)
    )
  );

drop policy if exists "link_clicks_select_own" on public.link_clicks;
create policy "link_clicks_select_own" on public.link_clicks
  for select using (
    public.is_workspace_member(
      (select p.workspace_id from public.pages p
       join public.links l on l.page_id = p.id
       where l.id = link_id)
    )
  );
