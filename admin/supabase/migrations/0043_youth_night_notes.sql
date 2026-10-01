-- ============================================================
-- 0043_youth_night_notes.sql — a free-text Notes field on each youth night (set when
-- starting a check-in session, shown on the Attendance tab).
-- ============================================================

alter table public.youth_nights add column if not exists notes text;
