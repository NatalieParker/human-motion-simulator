-- Run once if session_state.id is bigint + IDENTITY (or serial) and you need UUID/text ids.
-- Supabase SQL Editor → paste → Run (all statements in order).

-- 1) Remove GENERATED ... AS IDENTITY (Postgres 10+). Safe if the column never had identity.
alter table public.session_state
  alter column id drop identity if exists;

-- 2) Remove serial/bigserial default (nextval) if present
alter table public.session_state
  alter column id drop default;

-- 3) Now the type can be text (UUID strings from the app)
alter table public.session_state
  alter column id type text using id::text;

-- Dev cleanup (optional): clear old numeric ids
-- truncate public.session_state;
