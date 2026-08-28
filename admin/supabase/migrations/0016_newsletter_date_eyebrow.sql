-- ============================================================
-- 0016_newsletter_date_eyebrow.sql — adds the date and eyebrow
-- banner fields to newsletter_drafts, matching the headline
-- column added in 0015. Both are edited in-canvas already
-- (src/admin/newsletter.html) but weren't persisted with the
-- draft, silently reverting to defaults on reload.
-- ============================================================

alter table public.newsletter_drafts
  add column date text,
  add column eyebrow text;
