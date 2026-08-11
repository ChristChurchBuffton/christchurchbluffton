-- ============================================================
-- 0011_panel_announcements.sql — one-time "what's new" popups shown
-- to staff on login, targeted by role (staff/admin/site_admin, any
-- mix). Dismissal is per-person, not global, so one person clicking
-- Okay doesn't hide it from other targeted people who haven't seen
-- it yet. No compose UI yet — announcements are inserted directly
-- (same as this seed data) until/unless a real authoring page is
-- built.
-- ============================================================

create table public.panel_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  target_roles text[] not null,
  created_at timestamptz not null default now()
);
alter table public.panel_announcements enable row level security;

create policy "panel_announcements_select_any_logged_in" on public.panel_announcements
  for select using (auth.uid() is not null);
create policy "panel_announcements_write_site_admin_only" on public.panel_announcements
  for all using (public.is_site_admin())
  with check (public.is_site_admin());

create table public.panel_announcement_dismissals (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.panel_announcements(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  unique (announcement_id, user_id)
);
alter table public.panel_announcement_dismissals enable row level security;

create policy "panel_announcement_dismissals_own_insert" on public.panel_announcement_dismissals
  for insert with check (user_id = auth.uid());
create policy "panel_announcement_dismissals_own_select" on public.panel_announcement_dismissals
  for select using (user_id = auth.uid());

-- Sample content for localhost review — text to be finalized before any real push.
insert into public.panel_announcements (title, body, target_roles) values
  ('Prayer Request Log Updates', 'Prayer requests now sort with Active always first and Answered second. Answered requests move to a new Archive tab automatically after 60 days, and archived requests are permanently deleted 90 days after that.', array['admin','site_admin']),
  ('New: Notification Settings', 'A new Notification Settings page lets you manage who gets emailed for Prayer, Contact, and Newsletter form submissions — no code deploy needed to change it anymore.', array['site_admin']);
