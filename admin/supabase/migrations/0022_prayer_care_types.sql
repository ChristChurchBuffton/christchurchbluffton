-- ============================================================
-- 0022_prayer_care_types.sql — lets a prayer/pastoral care
-- submitter flag the specific type(s) of care they're looking
-- for (Prayer Requests, Hospital/Home Visit, Communion,
-- Bereavement/Grief Support, Spiritual Guidance, Other/Need),
-- so staff can see it in the admin panel rather than just the
-- notification email.
-- ============================================================

alter table public.prayer_requests
  add column care_types text[],
  add column other_need_text text;
