-- ============================================================
-- 0014_event_end_time.sql — adds an optional end_time to events,
-- so a listing can show "5:30 PM – 7:00 PM" instead of just a
-- start time. Existing rows just have it blank until edited.
-- ============================================================

alter table public.events
  add column end_time time;
