-- ============================================================
-- 0020_newsletter_archived_at.sql — adds an "archived_at" field
-- to newsletter_drafts. A Sent draft's "x" button now archives
-- it instead of permanently deleting it (nothing already sent
-- should be destroyable from this screen) — archived items move
-- out of the main Sent list into their own collapsible Archive
-- section, still viewable and still duplicable from there.
-- ============================================================

alter table public.newsletter_drafts
  add column archived_at timestamptz;
