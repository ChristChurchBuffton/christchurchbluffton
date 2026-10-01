-- ============================================================
-- 0039_student_school.sql — Kevin, 2026-09-30: "lets add Attending School
-- for new student signup and the roster." Also "maybe a secondary phone
-- number spot for parent/guardian" — added in the same pass.
-- ============================================================

alter table public.youth_students
  add column if not exists school text,
  add column if not exists parent_phone_2 text;
