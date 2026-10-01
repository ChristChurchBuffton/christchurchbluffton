-- ============================================================
-- 0037_parent_city_state_zip.sql — Parent/Guardian address split into
-- street (existing parent_address) + city/state/zip, matching the
-- pattern congregant_families already uses.
-- ============================================================

alter table public.youth_students
  add column if not exists parent_city text,
  add column if not exists parent_state text,
  add column if not exists parent_zip text;
