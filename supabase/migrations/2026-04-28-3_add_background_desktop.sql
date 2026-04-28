-- =====================================================================
-- Migration : 2026-04-28 — Image de fond desktop séparée
--
-- Ajoute `background_desktop_url` sur `pages`. Visible uniquement sur
-- grand écran, autour de la carte centrale (qui contient `background_url`).
-- Mobile : `background_url` suffit (la carte fait toute la largeur).
-- Idempotent.
-- =====================================================================

alter table public.pages
  add column if not exists background_desktop_url text;
