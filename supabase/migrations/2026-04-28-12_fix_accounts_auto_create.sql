-- =====================================================================
-- Migration : 2026-04-28 — Fix création auto du row accounts
--
-- Bug : le trigger handle_new_user ne créait un row accounts QUE si
-- raw_user_meta_data->>'username' était présent. Pour les inscriptions
-- via OAuth (Google) ou avec metadata vide, le compte n'avait pas de
-- ligne dans accounts → impossible d'avoir un tier, le UserMenu affichait
-- "null", l'éditeur ne pouvait pas lire le username, etc.
--
-- Fix : on génère TOUJOURS un username par défaut si pas fourni, et on
-- crée toujours la row accounts avec tier = 'visiteur' (par défaut).
-- Le user pourra changer son username plus tard depuis Settings.
-- Idempotent.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_age int;
  v_attempt int := 0;
  v_candidate text;
begin
  v_username := lower(coalesce(new.raw_user_meta_data->>'username', ''));

  begin
    v_age := nullif(new.raw_user_meta_data->>'age', '')::int;
  exception when others then
    v_age := null;
  end;

  -- Si pas de username fourni, on en génère un à partir de l'email ou
  -- de l'id, en respectant le format ^[a-z0-9-]{3,20}$.
  if v_username = '' then
    v_username := lower(
      regexp_replace(
        coalesce(split_part(new.email, '@', 1), 'user'),
        '[^a-z0-9-]',
        '',
        'g'
      )
    );
    if char_length(v_username) < 3 then
      v_username := 'user-' || substring(new.id::text, 1, 8);
    end if;
    if char_length(v_username) > 20 then
      v_username := substring(v_username, 1, 20);
    end if;
  end if;

  -- Garantir l'unicité : ajout de suffixe si collision
  -- Format max : ^[a-z0-9-]{3,20}$ → on a max 20 chars.
  -- 17 chars + "-" + 2 chars (jusqu'à v_attempt=99) = 20.
  v_candidate := v_username;
  loop
    exit when not exists (
      select 1 from public.accounts where username = v_candidate
    ) or v_attempt >= 50;
    v_attempt := v_attempt + 1;
    v_candidate := substring(v_username, 1, 17) || '-' || v_attempt::text;
  end loop;

  insert into public.accounts (id, username, age)
  values (new.id, v_candidate, v_age)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Le trigger lui-même reste celui du schema canonique, on s'assure
-- juste qu'il existe et pointe sur la nouvelle fonction.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----- Backfill des accounts manquants pour les users déjà existants -----
-- Pour tous les auth.users qui n'ont pas de row accounts, on en crée un
-- avec un username dérivé. Tier par défaut = 'pro' (grand-fathering :
-- ces comptes existaient avant le système de tiers).

-- Format username : ^[a-z0-9-]{3,20}$ → on a max 20 chars.
-- Ici : 15 chars d'email + "-" + 4 chars d'id = 20.
insert into public.accounts (id, username, tier)
select
  u.id,
  case
    when char_length(
      regexp_replace(
        lower(coalesce(split_part(u.email, '@', 1), 'user')),
        '[^a-z0-9-]', '', 'g'
      )
    ) >= 3
    then substring(
      regexp_replace(
        lower(coalesce(split_part(u.email, '@', 1), 'user')),
        '[^a-z0-9-]', '', 'g'
      ),
      1, 15
    ) || '-' || substring(u.id::text, 1, 4)
    else 'user-' || substring(u.id::text, 1, 8)
  end as username,
  'pro'::public.account_tier as tier
from auth.users u
left join public.accounts a on a.id = u.id
where a.id is null
on conflict (id) do nothing;
