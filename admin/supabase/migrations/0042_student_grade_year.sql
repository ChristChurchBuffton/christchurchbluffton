-- ============================================================
-- 0042_student_grade_year.sql — grades move up on their own every August 6.
-- grade_year = the school year (the calendar year it STARTS in; the school year starts Aug 6)
-- the grade was entered for. The page works out the current grade from the two, so nothing has
-- to be bumped by hand each year. Existing rows are stamped with the 2026-27 school year. (The code moves grades up every August 6, so the school year starts Aug 6, not Aug 1.)
-- ============================================================

alter table public.youth_student_details add column if not exists grade_year integer;
update public.youth_student_details set grade_year = 2026 where grade is not null and grade <> '' and grade_year is null;
