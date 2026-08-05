-- service_role bypasses RLS but still needs base table GRANTs, same as authenticated did.
-- Used by server/server.js (the secret key) for privileged team-management operations.

grant usage on schema public to service_role;

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
to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
