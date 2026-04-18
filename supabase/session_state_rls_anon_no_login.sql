-- Use this when you want the game to work WITHOUT Supabase Auth (anonymous visitors).
-- The browser only uses the anon key; policies must target role "anon".
--
-- Paste into Supabase SQL Editor and run once (or after removing authenticated-only policies).

alter table public.session_state enable row level security;

-- Drop authenticated-only policies if you tried those before
drop policy if exists "auth select session_state" on public.session_state;
drop policy if exists "auth insert session_state" on public.session_state;
drop policy if exists "auth update session_state" on public.session_state;

-- Drop old anon policies so we can recreate cleanly
drop policy if exists "anon select session_state" on public.session_state;
drop policy if exists "anon insert session_state" on public.session_state;
drop policy if exists "anon update session_state" on public.session_state;
drop policy if exists "anon can read session_state" on public.session_state;
drop policy if exists "anon can insert session_state" on public.session_state;
drop policy if exists "anon can update session_state" on public.session_state;

create policy "anon select session_state"
on public.session_state
for select
to anon
using (true);

create policy "anon insert session_state"
on public.session_state
for insert
to anon
with check (true);

create policy "anon update session_state"
on public.session_state
for update
to anon
using (true)
with check (true);

-- Pairing isolation comes from random UUID session ids in the app, not from RLS.
-- Anyone with your anon key could theoretically access rows if they guess a UUID;
-- for stricter control without login, you’d need Edge Functions or a server.
