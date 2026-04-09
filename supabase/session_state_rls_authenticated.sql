-- OPTIONAL: only if you add Supabase Auth to the app (sign-in required to play).
-- The default game flow uses anon only — use session_state_rls_anon_no_login.sql instead.
--
-- Prerequisite: your app must sign users in and attach the session JWT to Supabase client.
--
-- Paste into Supabase SQL Editor and run once.

alter table public.session_state enable row level security;

-- Remove permissive anon policies (both possible naming styles)
drop policy if exists "anon select session_state" on public.session_state;
drop policy if exists "anon insert session_state" on public.session_state;
drop policy if exists "anon update session_state" on public.session_state;
drop policy if exists "anon can read session_state" on public.session_state;
drop policy if exists "anon can insert session_state" on public.session_state;
drop policy if exists "anon can update session_state" on public.session_state;

-- Optional: remove old authenticated policies if re-running
drop policy if exists "auth select session_state" on public.session_state;
drop policy if exists "auth insert session_state" on public.session_state;
drop policy if exists "auth update session_state" on public.session_state;

-- Logged-in users only (still can see all rows — see note below)
create policy "auth select session_state"
on public.session_state
for select
to authenticated
using (true);

create policy "auth insert session_state"
on public.session_state
for insert
to authenticated
with check (true);

create policy "auth update session_state"
on public.session_state
for update
to authenticated
using (true)
with check (true);

-- NOTE: using (true) means any authenticated user can read/update any row.
-- True per-row isolation needs a schema like room_members + policies that check
-- auth.uid() against membership (and app changes). See README production section.
