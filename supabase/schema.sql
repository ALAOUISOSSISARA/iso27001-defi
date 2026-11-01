-- =====================================================================
--  ISO 27001 — Le défi Maersk
--  Schéma Supabase : tables, sécurité (RLS) et logique de jeu.
--
--  Principe de sécurité :
--   * Les étudiants n'ont AUCUN accès direct aux tables.
--   * Tout passe par des fonctions (RPC) qui vérifient l'état du jeu.
--   * Les bonnes réponses ne quittent jamais la base avant la révélation.
--   * Les points sont calculés côté serveur, avec l'horloge du serveur.
--
--  À exécuter une fois dans Supabase > SQL Editor, puis seed.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists public.admins (
  user_id uuid primary key
);

create table if not exists public.steps (
  idx            int primary key,
  kind           text not null check (kind in ('intro','question','estimate','incident')),
  clause         text,                 -- ex. "Clause 4 — Contexte"
  title          text not null,
  body           text,
  options        jsonb,                -- ["...", "...", "...", "..."] pour kind = question
  est_min        numeric,
  est_max        numeric,
  est_step       numeric,
  est_unit       text,
  time_limit     int  not null default 20,   -- secondes
  multiplier     int  not null default 1,
  -- ---- secret : jamais renvoyé aux joueurs avant la révélation ----
  correct_choice int,
  correct_value  numeric,
  tolerance      numeric,              -- écart donnant 100 % des points
  zero_at        numeric,              -- écart donnant 0 point
  explanation    text,
  story          jsonb                 -- puces affichées côté présentateur à la révélation
);

create table if not exists public.game_state (
  id            int primary key default 1 check (id = 1),
  step          int not null default -1,
  phase         text not null default 'lobby'
                check (phase in ('lobby','show','question','reveal','podium')),
  started_at    timestamptz,
  revealed_upto int not null default -1,
  updated_at    timestamptz not null default now()
);
insert into public.game_state (id) values (1) on conflict (id) do nothing;

create table if not exists public.players (
  id          uuid primary key default gen_random_uuid(),
  pseudo      text not null,
  token_hash  text not null,
  banned      boolean not null default false,
  created_at  timestamptz not null default now()
);
create unique index if not exists players_pseudo_uniq on public.players (lower(pseudo));

create table if not exists public.answers (
  player_id   uuid not null references public.players(id) on delete cascade,
  step        int  not null references public.steps(idx) on delete cascade,
  choice      int,
  value       numeric,
  elapsed_ms  int  not null,
  correct     boolean not null,
  points      int  not null,
  answered_at timestamptz not null default now(),
  primary key (player_id, step)
);

-- ---------------------------------------------------------------------
-- Row Level Security : tout est fermé, sauf la lecture de game_state
-- (nécessaire pour la synchronisation en temps réel).
-- ---------------------------------------------------------------------
alter table public.admins     enable row level security;
alter table public.steps      enable row level security;
alter table public.game_state enable row level security;
alter table public.players    enable row level security;
alter table public.answers    enable row level security;

drop policy if exists game_state_read on public.game_state;
create policy game_state_read on public.game_state
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public._hash(t text) returns text
language sql immutable set search_path = public as $$
  select encode(sha256(convert_to(t, 'UTF8')), 'hex');
$$;

-- Retourne l'id du joueur si (id, token) est valide et non exclu, sinon erreur.
create or replace function public._check_player(p_id uuid, p_token text) returns uuid
language plpgsql stable security definer set search_path = public as $$
declare v_banned boolean;
begin
  select banned into v_banned from public.players
   where id = p_id and token_hash = public._hash(p_token);
  if not found then raise exception 'UNKNOWN_PLAYER'; end if;
  if v_banned then raise exception 'BANNED'; end if;
  return p_id;
end $$;

-- ---------------------------------------------------------------------
-- RPC joueurs (anon)
-- ---------------------------------------------------------------------

create or replace function public.register_player(p_pseudo text) returns json
language plpgsql volatile security definer set search_path = public as $$
declare
  v_pseudo text := regexp_replace(btrim(coalesce(p_pseudo, '')), '\s+', ' ', 'g');
  v_token  text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_id     uuid;
begin
  if char_length(v_pseudo) < 2 or char_length(v_pseudo) > 20 then
    raise exception 'PSEUDO_INVALID';
  end if;
  if (select count(*) from public.players) >= 200 then
    raise exception 'GAME_FULL';
  end if;
  begin
    insert into public.players (pseudo, token_hash)
    values (v_pseudo, public._hash(v_token))
    returning id into v_id;
  exception when unique_violation then
    raise exception 'PSEUDO_TAKEN';
  end;
  return json_build_object('id', v_id, 'token', v_token, 'pseudo', v_pseudo);
end $$;

-- État courant + contenu PUBLIC de l'étape affichée (jamais les suivantes).
create or replace function public.get_state() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'step',          g.step,
    'phase',         g.phase,
    'started_at',    g.started_at,
    'server_now',    now(),
    'revealed_upto', g.revealed_upto,
    'total_steps',   (select count(*) from public.steps),
    'content', case when g.phase in ('show','question','reveal') then (
        select json_build_object(
          'idx', s.idx, 'kind', s.kind, 'clause', s.clause, 'title', s.title,
          'body', s.body, 'options', s.options,
          'est_min', s.est_min, 'est_max', s.est_max, 'est_step', s.est_step,
          'est_unit', s.est_unit, 'time_limit', s.time_limit, 'multiplier', s.multiplier)
        from public.steps s where s.idx = g.step)
      else null end
  )
  from public.game_state g where g.id = 1;
$$;

create or replace function public.submit_answer(
  p_id uuid, p_token text, p_step int, p_choice int default null, p_value numeric default null
) returns json
language plpgsql volatile security definer set search_path = public as $$
declare
  g        public.game_state;
  s        public.steps;
  v_ms     int;
  v_ok     boolean;
  v_frac   numeric;
  v_base   int;
  v_bonus  int := 0;
  v_points int;
  v_prev   int[];
  v_rows   int;
begin
  perform public._check_player(p_id, p_token);
  select * into g from public.game_state where id = 1;
  if g.phase <> 'question' or g.step <> p_step then raise exception 'CLOSED'; end if;

  select * into s from public.steps where idx = p_step;
  v_ms := floor(extract(epoch from (now() - g.started_at)) * 1000)::int;
  if v_ms > s.time_limit * 1000 + 1500 then raise exception 'TOO_LATE'; end if;
  v_ms := least(greatest(v_ms, 0), s.time_limit * 1000);

  if s.kind = 'question' then
    if p_choice is null or p_choice < 0 or p_choice >= jsonb_array_length(s.options) then
      raise exception 'BAD_INPUT';
    end if;
    v_ok   := (p_choice = s.correct_choice);
    -- 500 à 1000 points selon la rapidité
    v_base := case when v_ok
                then round(500 + 500 * (1 - v_ms::numeric / (s.time_limit * 1000)))
                else 0 end;
  elsif s.kind = 'estimate' then
    if p_value is null or p_value < s.est_min or p_value > s.est_max then
      raise exception 'BAD_INPUT';
    end if;
    v_ok := abs(p_value - s.correct_value) <= s.tolerance;
    v_frac := case
      when abs(p_value - s.correct_value) <= s.tolerance then 1
      when abs(p_value - s.correct_value) >= s.zero_at   then 0
      else 1 - (abs(p_value - s.correct_value) - s.tolerance) / (s.zero_at - s.tolerance)
    end;
    v_base := round(1000 * v_frac);
  else
    raise exception 'CLOSED';
  end if;

  -- Bonus de série : 3 bonnes réponses d'affilée (+200)
  if v_ok then
    select array_agg(idx) into v_prev from (
      select idx from public.steps
       where kind in ('question','estimate') and idx < p_step
       order by idx desc limit 2) t;
    if coalesce(array_length(v_prev, 1), 0) = 2 and
       (select count(*) from public.answers
         where player_id = p_id and step = any(v_prev) and correct) = 2 then
      v_bonus := 200;
    end if;
  end if;

  v_points := v_base * s.multiplier + v_bonus;

  insert into public.answers (player_id, step, choice, value, elapsed_ms, correct, points)
  values (p_id, p_step, p_choice, p_value, v_ms, v_ok, v_points)
  on conflict (player_id, step) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then raise exception 'ALREADY_ANSWERED'; end if;

  return json_build_object('ok', true);   -- volontairement : rien sur la justesse
end $$;

-- Score, rang et résultat de l'étape courante (seulement après révélation).
create or replace function public.get_my_status(p_id uuid, p_token text) returns json
language plpgsql stable security definer set search_path = public as $$
declare
  g        public.game_state;
  s        public.steps;
  a        public.answers;
  v_pseudo text;
  v_score  int;
  v_rank   int;
  v_total  int;
  v_result json := null;
begin
  perform public._check_player(p_id, p_token);
  select * into g from public.game_state where id = 1;
  select pseudo into v_pseudo from public.players where id = p_id;

  with scores as (
    select p.id, coalesce(sum(a2.points) filter (where a2.step <= g.revealed_upto), 0) as score
      from public.players p
      left join public.answers a2 on a2.player_id = p.id
     where not p.banned
     group by p.id)
  select (select score from scores where id = p_id),
         (select count(*) from scores) ,
         1 + (select count(*) from scores where score > (select score from scores where id = p_id))
    into v_score, v_total, v_rank;

  select * into s from public.steps where idx = g.step;
  select * into a from public.answers where player_id = p_id and step = g.step;

  if g.phase = 'reveal' and s.kind in ('question','estimate') then
    v_result := json_build_object(
      'answered', a.player_id is not null,
      'correct',  coalesce(a.correct, false),
      'points',   coalesce(a.points, 0),
      'choice',   a.choice,
      'value',    a.value,
      'correct_choice', s.correct_choice,
      'correct_value',  s.correct_value,
      'explanation',    s.explanation);
  end if;

  return json_build_object(
    'pseudo', v_pseudo, 'score', v_score, 'rank', v_rank, 'total', v_total,
    'answered_current', a.player_id is not null,
    'result', v_result);
end $$;

-- Classement public : ne compte que les questions déjà révélées.
create or replace function public.get_leaderboard(p_limit int default 10)
returns table (pseudo text, score int, rank int)
language sql stable security definer set search_path = public as $$
  with g as (select revealed_upto from public.game_state where id = 1),
  s as (
    select p.pseudo, p.created_at,
           coalesce(sum(a.points) filter (where a.step <= (select revealed_upto from g)), 0)::int as score
      from public.players p
      left join public.answers a on a.player_id = p.id
     where not p.banned
     group by p.id, p.pseudo, p.created_at)
  select pseudo, score, (rank() over (order by score desc))::int as rank
    from s order by score desc, created_at asc
   limit least(greatest(coalesce(p_limit, 10), 1), 100);
$$;

-- ---------------------------------------------------------------------
-- RPC présentateur (authentifié + présent dans la table admins)
-- ---------------------------------------------------------------------

create or replace function public._require_admin() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
end $$;

create or replace function public.admin_get_steps() returns setof public.steps
language plpgsql stable security definer set search_path = public as $$
begin
  perform public._require_admin();
  return query select * from public.steps order by idx;
end $$;

create or replace function public.admin_goto(p_step int) returns json
language plpgsql volatile security definer set search_path = public as $$
declare s public.steps;
begin
  perform public._require_admin();
  select * into s from public.steps where idx = p_step;
  if not found then raise exception 'NO_SUCH_STEP'; end if;
  update public.game_state set
    step       = p_step,
    phase      = case when s.kind in ('question','estimate') then 'question' else 'show' end,
    started_at = now(),
    updated_at = now()
  where id = 1;
  return public.get_state();
end $$;

create or replace function public.admin_reveal() returns json
language plpgsql volatile security definer set search_path = public as $$
begin
  perform public._require_admin();
  update public.game_state set
    phase = 'reveal', revealed_upto = greatest(revealed_upto, step), updated_at = now()
  where id = 1 and phase = 'question';
  return public.get_state();
end $$;

create or replace function public.admin_set_phase(p_phase text) returns json
language plpgsql volatile security definer set search_path = public as $$
begin
  perform public._require_admin();
  if p_phase not in ('lobby','podium') then raise exception 'BAD_PHASE'; end if;
  update public.game_state set
    phase = p_phase,
    step  = case when p_phase = 'lobby' then -1 else step end,
    updated_at = now()
  where id = 1;
  return public.get_state();
end $$;

create or replace function public.admin_stats() returns json
language plpgsql stable security definer set search_path = public as $$
declare g public.game_state;
begin
  perform public._require_admin();
  select * into g from public.game_state where id = 1;
  return json_build_object(
    'players',  (select count(*) from public.players where not banned),
    'answered', (select count(*) from public.answers a join public.players p on p.id = a.player_id
                  where a.step = g.step and not p.banned),
    'distribution', (select coalesce(json_agg(json_build_object('choice', choice, 'n', n) order by choice), '[]'::json)
                       from (select a.choice, count(*) n from public.answers a
                               join public.players p on p.id = a.player_id
                              where a.step = g.step and a.choice is not null and not p.banned
                              group by a.choice) d),
    'values', (select coalesce(json_agg(a.value order by a.value), '[]'::json)
                 from public.answers a join public.players p on p.id = a.player_id
                where a.step = g.step and a.value is not null and not p.banned),
    'correct_count', (select count(*) from public.answers a join public.players p on p.id = a.player_id
                       where a.step = g.step and a.correct and not p.banned),
    'recent', (select coalesce(json_agg(pseudo), '[]'::json) from (
                 select pseudo from public.players where not banned
                  order by created_at desc limit 40) r)
  );
end $$;

create or replace function public.admin_players()
returns table (id uuid, pseudo text, score int, banned boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public._require_admin();
  return query
    select p.id, p.pseudo, coalesce(sum(a.points), 0)::int, p.banned
      from public.players p left join public.answers a on a.player_id = p.id
     group by p.id order by p.created_at;
end $$;

create or replace function public.admin_kick(p_player uuid) returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  perform public._require_admin();
  update public.players set banned = true where id = p_player;
end $$;

create or replace function public.admin_reset(p_confirm text) returns json
language plpgsql volatile security definer set search_path = public as $$
begin
  perform public._require_admin();
  if p_confirm <> 'RESET' then raise exception 'CONFIRM_REQUIRED'; end if;
  delete from public.answers where true;
  delete from public.players where true;
  update public.game_state set step = -1, phase = 'lobby', started_at = null,
         revealed_upto = -1, updated_at = now() where id = 1;
  return public.get_state();
end $$;

-- ---------------------------------------------------------------------
-- Droits d'exécution
-- ---------------------------------------------------------------------
revoke all on function public._hash(text)                 from public;
revoke all on function public._check_player(uuid, text)   from public;
revoke all on function public._require_admin()            from public;

grant execute on function public.register_player(text)                              to anon, authenticated;
grant execute on function public.get_state()                                        to anon, authenticated;
grant execute on function public.submit_answer(uuid, text, int, int, numeric)       to anon, authenticated;
grant execute on function public.get_my_status(uuid, text)                          to anon, authenticated;
grant execute on function public.get_leaderboard(int)                               to anon, authenticated;

revoke all on function public.admin_get_steps()     from public, anon;
revoke all on function public.admin_goto(int)       from public, anon;
revoke all on function public.admin_reveal()        from public, anon;
revoke all on function public.admin_set_phase(text) from public, anon;
revoke all on function public.admin_stats()         from public, anon;
revoke all on function public.admin_players()       from public, anon;
revoke all on function public.admin_kick(uuid)      from public, anon;
revoke all on function public.admin_reset(text)     from public, anon;
grant execute on function public.admin_get_steps()     to authenticated;
grant execute on function public.admin_goto(int)       to authenticated;
grant execute on function public.admin_reveal()        to authenticated;
grant execute on function public.admin_set_phase(text) to authenticated;
grant execute on function public.admin_stats()         to authenticated;
grant execute on function public.admin_players()       to authenticated;
grant execute on function public.admin_kick(uuid)      to authenticated;
grant execute on function public.admin_reset(text)     to authenticated;

-- ---------------------------------------------------------------------
-- Temps réel : diffuser les changements de game_state
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                      where pubname = 'supabase_realtime' and tablename = 'game_state') then
    alter publication supabase_realtime add table public.game_state;
  end if;
end $$;
