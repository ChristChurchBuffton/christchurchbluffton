-- ============================================================
-- Christ Church Bluffton Admin Panel — Initial Supabase Schema
-- Run once, in order, via the Supabase SQL Editor (or a direct
-- Postgres connection). Safe to re-run individual CREATE TABLE
-- statements is NOT guaranteed — this is a first-run migration.
-- ============================================================

-- ---------------------------------------------------------------
-- profiles — extends auth.users with role/permissions/status.
-- Mirrors js/shared.js's PERMISSIONS array exactly:
-- contentEditor, photos, newsletter, subscribers, congregants,
-- prayers, events, signups (=Volunteers). Team access is
-- role-based (admin only), not a togglable permission.
-- ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique, -- mirrored from auth.users; client code can't read the auth schema directly
  name text not null,
  role text not null check (role in ('admin','staff')) default 'staff',
  permissions jsonb not null default '{}'::jsonb,
  status text not null check (status in ('invited','active')) default 'invited',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Is the current user an admin? (security definer so it can read
-- profiles without recursing through profiles' own RLS policy)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Does the current user have permission <perm> (or is admin)?
create or replace function public.has_permission(perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.profiles
    where id = auth.uid() and (permissions->>perm) = 'true'
  );
$$;

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_write_admin_only" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------
-- staff directory — open to any logged-in team member, no
-- specific permission gate (matches today's staff.html, which
-- has no data-permission attribute).
-- ---------------------------------------------------------------
create table public.staff_positions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0
);
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  position_id uuid references public.staff_positions(id) on delete set null,
  added_at timestamptz not null default now()
);
alter table public.staff_positions enable row level security;
alter table public.staff enable row level security;
create policy "staff_positions_any_logged_in" on public.staff_positions
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "staff_any_logged_in" on public.staff
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ---------------------------------------------------------------
-- congregant_families — household roster. Children stored as
-- jsonb array of {firstName,lastName,birthdate} — matches
-- congregants.html's existing shape, not normalized further.
-- ---------------------------------------------------------------
create table public.congregant_families (
  id uuid primary key default gen_random_uuid(),
  head_first_name text not null,
  head_last_name text not null,
  head_email text,
  head_phone text,
  spouse_first_name text,
  spouse_last_name text,
  spouse_email text,
  spouse_phone text,
  children jsonb not null default '[]'::jsonb,
  address text,
  attending_since date,
  added_at timestamptz not null default now()
);
alter table public.congregant_families enable row level security;
create policy "congregant_families_rw" on public.congregant_families
  for all using (public.has_permission('congregants'))
  with check (public.has_permission('congregants'));

-- ---------------------------------------------------------------
-- volunteers — teams stored as jsonb array of
-- {name, subTeam, isLead}, matching volunteers.html.
-- ---------------------------------------------------------------
create table public.sub_teams (
  id uuid primary key default gen_random_uuid(),
  team_name text not null,
  sub_team_names jsonb not null default '[]'::jsonb
);
create table public.volunteers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text,
  email text,
  teams jsonb not null default '[]'::jsonb,
  is_youth boolean not null default false,
  parent_name text,
  parent_phone text,
  parent_email text,
  added_at timestamptz not null default now()
);
alter table public.sub_teams enable row level security;
alter table public.volunteers enable row level security;
create policy "sub_teams_rw" on public.sub_teams
  for all using (public.has_permission('signups'))
  with check (public.has_permission('signups'));
create policy "volunteers_rw" on public.volunteers
  for all using (public.has_permission('signups'))
  with check (public.has_permission('signups'));

-- ---------------------------------------------------------------
-- subscribers — the mailing list
-- ---------------------------------------------------------------
create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  source text not null check (source in ('newsletter','contact','manual')) default 'manual',
  added_at timestamptz not null default now()
);
alter table public.subscribers enable row level security;
create policy "subscribers_rw" on public.subscribers
  for all using (public.has_permission('subscribers'))
  with check (public.has_permission('subscribers'));

-- ---------------------------------------------------------------
-- prayer_requests
-- ---------------------------------------------------------------
create table public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  is_anonymous boolean not null default false,
  requester_name text,
  email text,
  phone text,
  request_text text not null,
  status text not null check (status in ('active','answered','archived')) default 'active',
  submitted_at date not null default current_date
);
alter table public.prayer_requests enable row level security;
create policy "prayer_requests_rw" on public.prayer_requests
  for all using (public.has_permission('prayers'))
  with check (public.has_permission('prayers'));

-- ---------------------------------------------------------------
-- events — one row per series (recurring or multi-day), matching
-- events.html's model exactly (no per-occurrence explosion).
-- ---------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date not null,
  end_date date,
  event_time time,
  location text,
  description text,
  repeat text not null check (repeat in ('none','daily','weekly','monthly')) default 'none',
  repeat_until date,
  added_at timestamptz not null default now()
);
alter table public.events enable row level security;
create policy "events_rw" on public.events
  for all using (public.has_permission('events'))
  with check (public.has_permission('events'));

-- ---------------------------------------------------------------
-- newsletter_drafts
-- ---------------------------------------------------------------
create table public.newsletter_drafts (
  id uuid primary key default gen_random_uuid(),
  subject text,
  mode text not null check (mode in ('visual','html')) default 'visual',
  html_code text,
  blocks jsonb not null default '[]'::jsonb,
  saved_at timestamptz not null default now()
);
alter table public.newsletter_drafts enable row level security;
create policy "newsletter_drafts_rw" on public.newsletter_drafts
  for all using (public.has_permission('newsletter'))
  with check (public.has_permission('newsletter'));

-- ---------------------------------------------------------------
-- photos — metadata only; actual image bytes go in Storage
-- bucket "photos" (create via Dashboard > Storage, not SQL).
-- storage_path points at the object key inside that bucket.
-- ---------------------------------------------------------------
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  storage_path text not null,
  added_at timestamptz not null default now()
);
alter table public.photos enable row level security;
create policy "photos_rw" on public.photos
  for all using (public.has_permission('photos'))
  with check (public.has_permission('photos'));

-- ---------------------------------------------------------------
-- site_content_* — Content Editor. Seeded from content.html's
-- current hardcoded pageContent object as a one-time data migration
-- (Step 6 of the build order), not part of this schema file.
-- ---------------------------------------------------------------
create table public.site_content_fields (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  section_name text not null,
  field_label text not null,
  field_type text not null check (field_type in ('input','textarea')),
  field_value text not null default '',
  sort_order int not null default 0
);
create table public.site_content_images (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  section_name text not null,
  file text not null,
  label text,
  size text
);
create table public.site_content_repeats (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  section_name text not null,
  repeat_title text,
  sort_order int not null default 0,
  fields jsonb not null default '[]'::jsonb,
  image jsonb
);
alter table public.site_content_fields enable row level security;
alter table public.site_content_images enable row level security;
alter table public.site_content_repeats enable row level security;
create policy "site_content_fields_rw" on public.site_content_fields
  for all using (public.has_permission('contentEditor'))
  with check (public.has_permission('contentEditor'));
create policy "site_content_images_rw" on public.site_content_images
  for all using (public.has_permission('contentEditor'))
  with check (public.has_permission('contentEditor'));
create policy "site_content_repeats_rw" on public.site_content_repeats
  for all using (public.has_permission('contentEditor'))
  with check (public.has_permission('contentEditor'));

-- ---------------------------------------------------------------
-- activity_log — insert-only from any logged-in user (every page
-- logs its own actions); only admins can read/export it, matching
-- today's admin-only Activity Log card on team.html.
-- ---------------------------------------------------------------
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor text not null,
  action text not null,
  target text not null default ''
);
alter table public.activity_log enable row level security;
create policy "activity_log_insert_any_logged_in" on public.activity_log
  for insert with check (auth.uid() is not null);
create policy "activity_log_select_admin_only" on public.activity_log
  for select using (public.is_admin());
