-- ============================================================
-- 0018_newsletter_draft_name.sql — adds a "name" column to
-- newsletter_drafts, separate from "subject". Weekly subject
-- lines repeat almost every issue ("Christ Church Bluffton
-- Weekly Word"), so the Saved Drafts list needs its own,
-- independently editable label to actually tell drafts apart.
-- Existing drafts are backfilled from their current subject so
-- none of them silently show as "(untitled)" after this ships.
-- ============================================================

alter table public.newsletter_drafts
  add column name text;

update public.newsletter_drafts
  set name = subject
  where name is null;
