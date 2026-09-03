-- ============================================================
-- 0023_volunteer_background_check.sql — tracks background-check
-- approval and expiration dates for volunteers, specifically for
-- those serving on the Youth team (child-safety compliance).
-- Nullable/optional on every other team.
-- ============================================================

alter table public.volunteers
  add column background_check_approved_at date,
  add column background_check_expires_at date;
