-- ============================================================
-- 0030_youth_membership_core.sql — Workflow 6, Step 3: the New Student page,
-- its consent section, and the youth admin view's data.
--
-- Split into three tables per the brief's own data rule: "Youth-only data
-- (medical notes, consent, grade) lives in a separate table linked to the
-- student." youth_students holds the core identity (safe for any 'youth'
-- permission holder to see — the roster); youth_student_details holds grade
-- + medical notes; youth_consents holds the photo/video consent history.
-- Both of the sensitive tables are gated to 'youthLeader' specifically, one
-- step stricter than the general 'youth' tab permission.
-- ============================================================

-- Student ID: readable, unique, never reused (a sequence, not reused on delete) — "Y-0142".
create sequence public.youth_student_seq;

create table public.youth_students (
  id uuid primary key default gen_random_uuid(),
  student_code text not null unique default ('Y-' || lpad(nextval('public.youth_student_seq')::text, 4, '0')),
  first_name text not null default '',
  last_name text not null default '',
  address text,
  city text,
  state text,
  zip text,
  phone text,
  birthdate date,
  -- Set when the parent lookup at signup matches or creates a household; a student can exist
  -- without one yet (e.g. imported, or the parent-link step failed) — check-in and the roster
  -- still work either way.
  family_id uuid references public.congregant_families(id) on delete set null,
  parent_first_name text,
  parent_last_name text,
  parent_email text,
  parent_phone text,
  created_at timestamptz not null default now()
);
create index youth_students_family_id_idx on public.youth_students(family_id);

alter table public.youth_students enable row level security;
create policy "youth_students_rw" on public.youth_students
  for all using (public.has_permission('youth'))
  with check (public.has_permission('youth'));
grant select, insert, update, delete on public.youth_students to authenticated, service_role;

-- Grade + medical notes — sensitive, per the brief ("visible only to a youth-leader role").
create table public.youth_student_details (
  student_id uuid primary key references public.youth_students(id) on delete cascade,
  grade text,
  medical_notes text,
  updated_at timestamptz not null default now()
);
alter table public.youth_student_details enable row level security;
create policy "youth_student_details_rw" on public.youth_student_details
  for all using (public.has_permission('youthLeader'))
  with check (public.has_permission('youthLeader'));
grant select, insert, update, delete on public.youth_student_details to authenticated, service_role;

-- One row per signature — a real history, not a single overwritten record, so "yearly
-- expiration/renewal" and "revoke" both just mean adding a new row (see is_current below);
-- nothing is ever destroyed to change consent status.
create table public.youth_consents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.youth_students(id) on delete cascade,
  identifiable_photos boolean not null default false,
  identifiable_video boolean not null default false,
  signature_name text not null,
  signed_at date not null default current_date,
  terms_version text not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index youth_consents_student_id_idx on public.youth_consents(student_id);
alter table public.youth_consents enable row level security;
create policy "youth_consents_rw" on public.youth_consents
  for all using (public.has_permission('youthLeader'))
  with check (public.has_permission('youthLeader'));
grant select, insert, update, delete on public.youth_consents to authenticated, service_role;

-- The one row of current consent-terms wording — "editable in the admin panel without a code
-- change" (brief). `version` is stamped onto every youth_consents row at signing time, so a
-- later wording change never silently reinterprets an old signature. Bumping the version is a
-- manual staff decision (only meaningfully different wording needs a fresh signature), not
-- automatic on every edit — a typo fix shouldn't force every family to re-consent.
create table public.youth_consent_terms (
  id boolean primary key default true check (id),  -- exactly one row, always
  version text not null default 'v1',
  body text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.youth_consent_terms (version, body) values ('v1',
  '<p><strong>Placeholder — replace with the church''s final wording before this goes live.</strong></p>' ||
  '<p>By submitting this form, the parent or legal guardian named below acknowledges Christ Church Bluffton''s student protection policy, including that all volunteers working with students undergo a background check and are subject to the church''s volunteer vetting process. Personal information provided here is kept private and used only for administrative and safety purposes related to the youth ministry.</p>' ||
  '<p><strong>Photo &amp; Video Consent.</strong> If you choose Yes below, Christ Church Bluffton may use identifiable photos and/or video of the student named above for church information and promotion on its website and official social media accounts. Only a Yes choice grants permission, and your choice applies only to this student. This does not permit publishing the student''s name alongside the media. You may withdraw permission at any time by contacting the church office; copies already shared by others may remain outside the church''s control. This consent is valid for one year from the date signed and will need to be renewed annually.</p>'
);
-- No anon grant: the public New Student page never talks to Supabase directly (same pattern as
-- every other public form on this site) — it reads the current terms through a Netlify Function
-- using the service key, same as it submits through one.
alter table public.youth_consent_terms enable row level security;
create policy "youth_consent_terms_select" on public.youth_consent_terms
  for select using (public.has_permission('youth') or public.has_permission('youthLeader'));
create policy "youth_consent_terms_write" on public.youth_consent_terms
  for update using (public.has_permission('youthLeader')) with check (public.has_permission('youthLeader'));
grant select on public.youth_consent_terms to authenticated, service_role;
grant update on public.youth_consent_terms to authenticated, service_role;
