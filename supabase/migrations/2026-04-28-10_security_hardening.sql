-- =====================================================================
-- Migration : 2026-04-28 — Durcissement sécurité (audit)
--
-- 1) Contrainte format URL sur links.url et qr_codes.target_url :
--    refuse les URLs non http(s) au niveau DB (defense en profondeur,
--    Zod faisait déjà le check côté app).
--
-- 2) Trigger anti-modification de workspaces.is_personal :
--    un user pouvait via l'API PostgREST flipper is_personal et faire
--    croire à l'app qu'un workspace partagé est "personnel".
--
-- Idempotent.
-- =====================================================================

-- ---------- 1) Contrainte format URL sur links.url ----------

-- Drop puis recréation pour idempotence (les noms sont fixes)
alter table public.links
  drop constraint if exists links_url_format;
alter table public.links
  add constraint links_url_format
  check (url = '' or url ~* '^https?://');

-- ---------- 2) Contrainte format URL sur qr_codes.target_url ----------

alter table public.qr_codes
  drop constraint if exists qr_codes_target_url_format;
alter table public.qr_codes
  add constraint qr_codes_target_url_format
  check (target_url ~* '^https?://');

-- ---------- 3) Trigger anti-modification de workspaces.is_personal ----------

create or replace function public.workspaces_block_is_personal_change()
returns trigger
language plpgsql
as $$
begin
  if new.is_personal is distinct from old.is_personal then
    raise exception 'Cannot modify is_personal on an existing workspace.';
  end if;
  return new;
end;
$$;

drop trigger if exists workspaces_block_is_personal on public.workspaces;
create trigger workspaces_block_is_personal
  before update on public.workspaces
  for each row execute function public.workspaces_block_is_personal_change();
