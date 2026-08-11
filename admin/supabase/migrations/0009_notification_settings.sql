-- ============================================================
-- 0009_notification_settings.sql — lets Site Administrators manage
-- who gets emailed when a prayer/contact/newsletter form is
-- submitted, instead of that list being hardcoded in the Netlify
-- function files (a code deploy required every time it changes).
-- Seeded with the addresses already hardcoded today so behavior
-- doesn't change until someone edits it in the new Notification
-- Settings page.
-- ============================================================

create table public.notification_settings (
  form_key text primary key check (form_key in ('prayer','contact','newsletter')),
  recipients text[] not null,
  updated_at timestamptz not null default now()
);
alter table public.notification_settings enable row level security;

-- Site Admin only (not just any Admin) — same tier as team.html/Accounts,
-- since this controls where real prayer requests and inquiries actually go.
create policy "notification_settings_rw" on public.notification_settings
  for all using (public.is_site_admin())
  with check (public.is_site_admin());

insert into public.notification_settings (form_key, recipients) values
  ('prayer', array['admin@christchurchbluffton.org','jonathan@christchurchbluffton.org','bradley@christchurchbluffton.org']),
  ('contact', array['info@christchurchbluffton.org','admin@christchurchbluffton.org']),
  ('newsletter', array['info@christchurchbluffton.org']);
