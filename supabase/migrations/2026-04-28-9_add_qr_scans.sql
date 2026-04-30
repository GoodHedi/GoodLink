-- =====================================================================
-- Migration : 2026-04-28 — Tracking des scans QR
--
-- Modèle :
--   - Nouvelle table public.qr_scans (id, qr_id, scanned_at)
--   - Nouvelle colonne qr_codes.tracked (boolean, default false)
--
-- Les QR existants restent "non trackés" (tracked = false par défaut sur
-- l'INSERT mais aussi par backfill). Ils encodent toujours target_url
-- en direct → les anciens QR imprimés continuent de marcher inchangés.
--
-- Les nouveaux QR créés depuis le code seront marqués tracked = true et
-- encoderont une URL /q/<id>?, redirigée serveur après log dans qr_scans.
-- Idempotent.
-- =====================================================================

-- ---------- 1) colonne tracked ----------

alter table public.qr_codes
  add column if not exists tracked boolean not null default false;

-- ---------- 2) table qr_scans ----------

create table if not exists public.qr_scans (
  id bigint generated always as identity primary key,
  qr_id uuid not null references public.qr_codes(id) on delete cascade,
  scanned_at timestamptz not null default now()
);

create index if not exists qr_scans_qr_id_idx
  on public.qr_scans (qr_id, scanned_at desc);

-- ---------- 3) RLS ----------

alter table public.qr_scans enable row level security;

-- Insert public (tracking côté serveur via /q/[id])
drop policy if exists "qr_scans_insert_public" on public.qr_scans;
create policy "qr_scans_insert_public" on public.qr_scans
  for insert with check (true);

-- Lecture par membre du workspace propriétaire du QR
drop policy if exists "qr_scans_select_member" on public.qr_scans;
create policy "qr_scans_select_member" on public.qr_scans
  for select using (
    public.is_workspace_member(
      (select workspace_id from public.qr_codes where id = qr_id)
    )
  );
