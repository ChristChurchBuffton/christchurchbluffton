-- ============================================================
-- 0029_household_intake.sql — Workflow 6, Step 2: the public adult/household
-- intake form. Submissions never write directly into congregant_families —
-- they land here as "pending" and a staff member reviews/merges them, per
-- the brief ("status Pending for review before it merges into live records").
-- ============================================================

create table public.household_intake_submissions (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'dismissed')),
  -- Free-form on purpose: intake fields are optional/loose ("names, address, phone, email,
  -- family members, birthdays"), and a submission may include people who don't map cleanly to
  -- head/spouse/children until a staff member reviews it. jsonb keeps the raw submission intact
  -- for that review instead of forcing a shape too early.
  payload jsonb not null default '{}'::jsonb,
  -- Set at submit time by the duplicate check (email OR phone + last name). Null = no match
  -- found, this looks like a brand-new household.
  matched_family_id uuid references public.congregant_families(id) on delete set null,
  submitted_ip text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index household_intake_submissions_status_idx on public.household_intake_submissions(status);

alter table public.household_intake_submissions enable row level security;
create policy "household_intake_submissions_rw" on public.household_intake_submissions
  for all using (public.has_permission('congregants'))
  with check (public.has_permission('congregants'));
grant select, insert, update, delete on public.household_intake_submissions to authenticated, service_role;
-- The public form itself writes as service_role from a Netlify Function, never as
-- authenticated/anon directly — no anon insert policy is added on purpose.
