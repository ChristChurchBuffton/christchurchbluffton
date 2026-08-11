-- ============================================================
-- 0010_prayer_status_tracking.sql — tracks WHEN a prayer request's
-- status last changed, so the admin panel can auto-progress old
-- ones: Answered sits for 60 days then becomes Archived; Archived
-- sits for 90 days then gets permanently deleted. Active never
-- expires on its own.
-- ============================================================

alter table public.prayer_requests
  add column status_changed_at timestamptz not null default now();

-- Keeps status_changed_at accurate no matter which code path updates status
-- (admin panel edit, a future automated sweep, direct SQL, etc.) rather than
-- relying on every caller to remember to set it.
create or replace function public.prayer_status_changed() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at = now();
  end if;
  return new;
end;
$$;

create trigger trg_prayer_status_changed
  before update on public.prayer_requests
  for each row execute function public.prayer_status_changed();
