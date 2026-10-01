-- ============================================================
-- 0041_notification_settings_contact_youth.sql — the contact form's "Youth Group"
-- choice gets its own "who gets emailed" setting, editable in Notification Settings
-- like every other form (it was a hardcoded list in contact.js).
-- ============================================================

alter table public.notification_settings drop constraint notification_settings_form_key_check;
alter table public.notification_settings add constraint notification_settings_form_key_check
  check (form_key in ('prayer', 'contact', 'newsletter', 'household_intake', 'new_student_signup', 'contact_youth'));

insert into public.notification_settings (form_key, recipients) values
  ('contact_youth', array['bradley@christchurchbluffton.org', 'admin@christchurchbluffton.org', 'youth@christchurchbluffton.org'])
on conflict (form_key) do nothing;
