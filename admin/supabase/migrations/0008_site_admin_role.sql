-- ============================================================
-- 0008_site_admin_role.sql — adds a third role tier, "site_admin",
-- above "admin". Only Site Administrators can invite new team
-- members or edit/remove Admin (or other Site Administrator)
-- accounts. Regular Admins keep full data access and can still
-- manage Staff accounts exactly like before, but can no longer
-- touch Admin/Site Administrator rows.
-- ============================================================

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','staff','site_admin'));

-- is_admin() now covers both admin and site_admin, so every existing
-- has_permission()/RLS policy already built on top of it (Congregants,
-- Prayer Requests, Photos, Events, etc.) keeps working for Site
-- Administrators automatically — no further changes needed there.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','site_admin'));
$$;

-- New, narrower check used only for team-management actions
-- (invite / edit-or-remove an Admin / remove any account outright).
create or replace function public.is_site_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'site_admin');
$$;

-- Replace the old blanket "any admin can write any profile row" policy
-- with tiered control: Site Administrators can touch any row; regular
-- Admins can only touch rows that are (and, after the update, remain)
-- Staff — so an Admin can edit a Staff member's permissions, but can't
-- promote them, and can't touch another Admin or Site Administrator.
drop policy if exists "profiles_write_admin_only" on public.profiles;

create policy "profiles_insert_site_admin_only" on public.profiles
  for insert with check (public.is_site_admin());

create policy "profiles_update_site_admin_any" on public.profiles
  for update using (public.is_site_admin())
  with check (public.is_site_admin());

-- Admins can only ever touch a row that STARTS as Staff (using), but the result
-- can be Staff or Admin (with check) — this is what lets an Admin promote a Staff
-- member up to Admin. They still can never touch a row that's already Admin or
-- Site Administrator, and can never set role to site_admin themselves.
create policy "profiles_update_admin_staff_only" on public.profiles
  for update using (public.is_admin() and role = 'staff')
  with check (public.is_admin() and role in ('staff','admin'));

create policy "profiles_delete_site_admin_only" on public.profiles
  for delete using (public.is_site_admin());

-- The profiles table has a trigger (trg_prevent_self_privilege_escalation, see
-- 0004_self_profile_update.sql) that pins role/permissions/email back to their old
-- value on any update where the ACTING session isn't already an admin. Run from the
-- SQL Editor (no logged-in session, so auth.uid() is null), that trigger would
-- silently revert both updates below unless it's temporarily disabled first.
alter table public.profiles disable trigger trg_prevent_self_privilege_escalation;

-- Promote the 3 people chosen as Site Administrators (2026-08-05).
update public.profiles set role = 'site_admin'
  where email in ('kevin@forgeddigitaldesign.com', 'admin@christchurchbluffton.org', 'jonathan@christchurchbluffton.org');

-- Admin's page access is now individually dial-able (hasPermission() in shared.js
-- no longer blanket-bypasses for role='admin', only for 'site_admin') — so any
-- existing Admin with an empty permissions object needs it backfilled to everything
-- checked, or they'd silently lose all page access the moment this ships.
update public.profiles set permissions = '{"contentEditor":true,"photos":true,"newsletter":true,"subscribers":true,"congregants":true,"prayers":true,"events":true,"signups":true}'::jsonb
  where role = 'admin' and permissions = '{}'::jsonb;

alter table public.profiles enable trigger trg_prevent_self_privilege_escalation;
