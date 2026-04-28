-- =====================================================================
-- Migration : 2026-04-28 — Logo central des QR codes
--
-- Ajoute une colonne `logo_url` (text, nullable) à `qr_codes` pour
-- pouvoir intégrer une image au centre des QR codes générés.
-- Stockage : bucket `avatars`, convention `<owner_id>/qr-<timestamp>.webp`.
-- Idempotent.
-- =====================================================================

alter table public.qr_codes
  add column if not exists logo_url text;
