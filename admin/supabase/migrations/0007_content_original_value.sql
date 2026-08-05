-- The preview binds edits by matching the CURRENT live-site text, then overwriting it —
-- it needs a permanently-frozen "as-shipped" copy of each field to search for, separate
-- from field_value (which changes on every save). Without this, a reloaded field_value
-- that's already been edited gets mistaken for the thing to search for in the mirror
-- HTML, which still has the original text — so the edit silently fails to re-bind.
alter table public.site_content_fields add column original_value text not null default '';
