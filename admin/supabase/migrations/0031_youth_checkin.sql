-- ============================================================
-- 0031_youth_checkin.sql — Workflow 6, Step 4: youth check-in sessions
-- ("Youth Nights"), saved leader/location lists, and attendance.
-- ============================================================

create table public.youth_leaders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.youth_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.youth_nights (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  leader_id uuid references public.youth_leaders(id) on delete set null,
  leader_name_snapshot text not null,   -- kept even if the leader is later removed from the saved list
  location_id uuid references public.youth_locations(id) on delete set null,
  location_name_snapshot text not null,
  started_by text not null default '',
  created_at timestamptz not null default now()
);

create table public.youth_attendance (
  id uuid primary key default gen_random_uuid(),
  night_id uuid not null references public.youth_nights(id) on delete cascade,
  -- References the Student ID, never the name, per the brief ("All attendance records
  -- reference the Student ID, not the name").
  student_id uuid not null references public.youth_students(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  unique (night_id, student_id)  -- the actual "prevent double check-in for the same night" rule
);
create index youth_attendance_student_id_idx on public.youth_attendance(student_id);

alter table public.youth_leaders enable row level security;
alter table public.youth_locations enable row level security;
alter table public.youth_nights enable row level security;
alter table public.youth_attendance enable row level security;

create policy "youth_leaders_rw" on public.youth_leaders for all using (public.has_permission('youth')) with check (public.has_permission('youth'));
create policy "youth_locations_rw" on public.youth_locations for all using (public.has_permission('youth')) with check (public.has_permission('youth'));
create policy "youth_nights_rw" on public.youth_nights for all using (public.has_permission('youth')) with check (public.has_permission('youth'));
create policy "youth_attendance_rw" on public.youth_attendance for all using (public.has_permission('youth')) with check (public.has_permission('youth'));

grant select, insert, update, delete on public.youth_leaders, public.youth_locations, public.youth_nights, public.youth_attendance to authenticated, service_role;
