-- ============================================================
-- 0021_subscribers_list_type.sql — adds a "list_type" column to
-- subscribers so the Subscribers page can split into two tabs:
-- Christ Church Newsletter and Youth Group Newsletter. Defaults
-- everyone existing to 'christ_church' (the only list that's
-- ever existed so far — Youth Group has no public signup source
-- yet, it's manual-add only for now).
-- ============================================================

alter table public.subscribers
  add column list_type text not null default 'christ_church'
  check (list_type in ('christ_church', 'youth_group'));
