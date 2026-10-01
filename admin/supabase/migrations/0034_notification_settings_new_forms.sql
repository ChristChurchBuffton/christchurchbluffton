-- ============================================================
-- 0034_notification_settings_new_forms.sql — Workflow 6's two new public forms
-- (household intake, new student signup) get the same "who gets emailed" admin
-- control as every other form, instead of a hardcoded recipient list.
-- ============================================================

alter table public.notification_settings drop constraint notification_settings_form_key_check;
alter table public.notification_settings add constraint notification_settings_form_key_check
  check (form_key in ('prayer', 'contact', 'newsletter', 'household_intake', 'new_student_signup'));

insert into public.notification_settings (form_key, recipients) values
  ('household_intake', array['admin@christchurchbluffton.org']),
  ('new_student_signup', array['admin@christchurchbluffton.org'])
on conflict (form_key) do nothing;
