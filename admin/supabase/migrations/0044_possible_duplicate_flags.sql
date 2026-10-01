-- ============================================================
-- 0044_possible_duplicate_flags.sql — forms flag likely duplicates instead of silently
-- creating them. A student with the same name as one already on file (in another household), and a
-- household with the same last name as one already on file, get a pointer to the existing record so
-- staff can review it (and dismiss the flag if it's not a duplicate). Pointers clear themselves if the
-- other record is deleted.
-- ============================================================

alter table public.youth_students
  add column if not exists possible_duplicate_student_id uuid references public.youth_students(id) on delete set null;

alter table public.congregant_families
  add column if not exists possible_duplicate_family_id uuid references public.congregant_families(id) on delete set null;
