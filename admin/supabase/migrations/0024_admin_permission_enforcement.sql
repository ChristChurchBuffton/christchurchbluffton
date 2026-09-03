-- ============================================================
-- 0024_admin_permission_enforcement.sql
--
-- Two related fixes, both about the same gap: an Admin whose access to a
-- specific page (e.g. Prayer & Pastoral Care) has been turned off by a Site
-- Admin could still actually reach that page's real data underneath the UI.
--
-- 1) has_permission() previously read "is_admin() OR has the specific flag" —
--    since is_admin() is true for BOTH 'admin' and 'site_admin' roles, this
--    meant every Admin silently bypassed every per-page permission check at
--    the database level, regardless of what their checklist said. The
--    checklist only ever blocked the on-screen page render (client-side) —
--    the underlying table read/write was never actually restricted. Only
--    Site Admin is supposed to get blanket access; Admin's access is meant
--    to be individually dial-able (see team.html's own comments), so this
--    now checks is_site_admin() instead of is_admin().
--
-- 2) The activity log had the same problem one level up: any Admin or Site
--    Admin could read every row regardless of their own page permissions,
--    so turning off someone's Prayers access didn't stop them from seeing
--    "Edited prayer request — Joe" in their Recent Activity feed. Now an
--    Admin only sees log rows for actions tied to a page they currently
--    have access to. Actions that aren't gated by a specific permission
--    (login/logout/access_denied/dev_update/staff_* — Staff directory is
--    open to every logged-in team member) are unaffected. Notification
--    Settings and Accounts are Site-Admin-only pages regardless of the
--    permissions checklist, so their log actions are Site-Admin-only too.
--    Site Admin still sees everything, same as before.
-- ============================================================

create or replace function public.has_permission(perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_site_admin() or exists (
    select 1 from public.profiles
    where id = auth.uid() and (permissions->>perm) = 'true'
  );
$$;

create or replace function public.activity_log_visible(p_action text) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when public.is_site_admin() then true
    when not public.is_admin() then false
    when p_action in ('prayer_add','prayer_edit','prayer_remove') then public.has_permission('prayers')
    when p_action in ('congregant_add','congregant_edit','congregant_remove') then public.has_permission('congregants')
    when p_action in ('volunteer_add','volunteer_edit','volunteer_remove') then public.has_permission('signups')
    when p_action in ('subscriber_add','subscriber_edit','subscriber_remove') then public.has_permission('subscribers')
    when p_action in ('event_add','event_edit','event_remove') then public.has_permission('events')
    when p_action in ('draft_save','draft_delete','draft_duplicate','draft_archive','draft_unarchive') then public.has_permission('newsletter')
    when p_action = 'content_save' then public.has_permission('contentEditor')
    when p_action in ('photo_add','photo_remove') then public.has_permission('photos')
    when p_action in ('notification_settings_edit','team_invite','team_edit','team_remove','team_reset_pw') then false
    else true
  end;
$$;

drop policy if exists "activity_log_select_admin_only" on public.activity_log;
create policy "activity_log_select_permission_filtered" on public.activity_log
  for select using (public.activity_log_visible(action));
