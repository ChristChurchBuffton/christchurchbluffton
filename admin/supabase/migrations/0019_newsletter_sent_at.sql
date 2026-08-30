-- ============================================================
-- 0019_newsletter_sent_at.sql — adds a "sent_at" timestamp to
-- newsletter_drafts. Nothing sets this yet (Send Newsletter is
-- still a stub, not wired to Resend), but the Saved Drafts list
-- already needs to distinguish "still being worked on" from
-- "already went out" so a sent issue doesn't sit mixed in with
-- editable drafts. Null = still a draft; a real timestamp = sent.
-- ============================================================

alter table public.newsletter_drafts
  add column sent_at timestamptz;
