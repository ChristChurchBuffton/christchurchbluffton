-- ============================================================
-- 0015_newsletter_headline.sql — adds an optional headline to
-- newsletter_drafts, separate from the plain email subject line.
-- Matches the real "Weekly Word" template: Subject is the plain
-- email subject, Headline is the big display title in the banner
-- (e.g. subject "Christ Church Bluffton Weekly Word", headline
-- "New, Yet Familiar").
-- ============================================================

alter table public.newsletter_drafts
  add column headline text;
