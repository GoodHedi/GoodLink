-- =====================================================================
-- Migration : 2026-04-28 — Audio léger par page
--
-- 1 audio max par page (champ `audio_url` sur `pages`).
-- Storage bucket `audios` public, écriture restreinte au owner du dossier
-- (convention <ownerId>/<pageId>/audio-<ts>.<ext>).
-- Idempotent.
-- =====================================================================

-- ---------- 1) colonne audio_url ----------

alter table public.pages
  add column if not exists audio_url text;

-- ---------- 2) bucket audios ----------

insert into storage.buckets (id, name, public)
values ('audios', 'audios', true) on conflict (id) do nothing;

drop policy if exists "audios_read_public" on storage.objects;
create policy "audios_read_public" on storage.objects
  for select using (bucket_id = 'audios');

drop policy if exists "audios_insert_own" on storage.objects;
create policy "audios_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'audios' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "audios_update_own" on storage.objects;
create policy "audios_update_own" on storage.objects
  for update using (
    bucket_id = 'audios' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "audios_delete_own" on storage.objects;
create policy "audios_delete_own" on storage.objects
  for delete using (
    bucket_id = 'audios' and auth.uid()::text = (storage.foldername(name))[1]
  );
