-- =====================================================================
-- Migration : 2026-04-28 — Personnalisation style des pages
--
-- Ajoute :
--  - link_color    (couleur de fond des boutons lien, hex)
--  - link_shape    ('pill' | 'rounded' | 'square')
--  - font_family   ('sans' | 'serif' | 'mono' | 'display')
-- Idempotent.
-- =====================================================================

alter table public.pages
  add column if not exists link_color text not null default '#FFFFFF',
  add column if not exists link_shape text not null default 'pill',
  add column if not exists font_family text not null default 'sans';

-- Contraintes d'enum
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pages_link_shape_check'
  ) then
    alter table public.pages
      add constraint pages_link_shape_check
      check (link_shape in ('pill', 'rounded', 'square'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'pages_font_family_check'
  ) then
    alter table public.pages
      add constraint pages_font_family_check
      check (font_family in ('sans', 'serif', 'mono', 'display'));
  end if;
end $$;
