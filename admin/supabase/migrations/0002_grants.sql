-- ============================================================
-- Grant base table privileges to the authenticated role.
-- RLS policies (0001) control WHICH rows are visible/writable;
-- these GRANTs are what let the authenticated role query the
-- tables at all in the first place. No anon grants — every page
-- in this app requires a logged-in session.
-- ============================================================

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.staff_positions,
  public.staff,
  public.congregant_families,
  public.sub_teams,
  public.volunteers,
  public.subscribers,
  public.prayer_requests,
  public.events,
  public.newsletter_drafts,
  public.photos,
  public.site_content_fields,
  public.site_content_images,
  public.site_content_repeats,
  public.activity_log
to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
