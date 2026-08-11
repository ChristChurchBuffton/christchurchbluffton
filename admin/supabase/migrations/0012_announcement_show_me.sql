-- ============================================================
-- 0012_announcement_show_me.sql — optional "Show Me" target for an
-- announcement: which page to jump to and what to highlight there.
-- Nullable — an announcement with nothing set just doesn't get a
-- Show Me button, only Next/Okay.
-- ============================================================

alter table public.panel_announcements
  add column target_page text,
  add column highlight_selector text;

update public.panel_announcements
  set target_page = 'prayers.html', highlight_selector = '#tab-archive'
  where title = 'Prayer Request Log Updates';

update public.panel_announcements
  set target_page = 'notifications.html', highlight_selector = '[data-page="notifications"]'
  where title = 'New: Notification Settings';
