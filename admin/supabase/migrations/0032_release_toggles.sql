-- ============================================================
-- 0032_release_toggles.sql — a generic on/off switch table, reused for both
-- the adult/household form and the whole youth system per the brief ("Adult
-- form and youth system held behind a release toggle. Launch at
-- leadership's direction."). Both start OFF — nothing here is public until
-- a Site Admin turns it on in the admin panel.
-- ============================================================

create table public.release_toggles (
  key text primary key,
  enabled boolean not null default false,
  label text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text
);
insert into public.release_toggles (key, label, enabled) values
  ('household_intake_form', 'Public Household/Member Form', false),
  ('youth_system', 'Youth Membership & Check-In System', false);

-- Read: the public forms' own Netlify Functions check this (via the service key) before
-- accepting a submission, so a toggle flip takes effect immediately with no redeploy. Write:
-- Site Admin only — this is a leadership go/no-go switch, not an ordinary content edit.
alter table public.release_toggles enable row level security;
create policy "release_toggles_select" on public.release_toggles
  for select using (public.has_permission('congregants') or public.has_permission('youth'));
create policy "release_toggles_write" on public.release_toggles
  for update using (public.is_site_admin()) with check (public.is_site_admin());
grant select on public.release_toggles to authenticated, service_role;
grant update on public.release_toggles to authenticated, service_role;
