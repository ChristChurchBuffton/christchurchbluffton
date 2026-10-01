-- ============================================================
-- 0035_youth_notes_and_contact_fields.sql — Workflow 6 follow-up (Kevin, 2026-09-29):
-- rename "medical notes" to a general student Notes field, add a real Parent/Guardian
-- Address column, and add a Student Email column (student already had Phone).
-- ============================================================

alter table public.youth_student_details rename column medical_notes to notes;

alter table public.youth_students add column parent_address text;
alter table public.youth_students add column email text;
