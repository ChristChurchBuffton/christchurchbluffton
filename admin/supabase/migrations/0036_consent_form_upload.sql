-- ============================================================
-- 0036_consent_form_upload.sql — lets a youth leader record consent directly from the
-- roster's Add/Edit Student screen: toggle Photos/Video, and attach a scanned paper
-- form when a family signed on paper instead of the online form.
-- Additive only: one new bucket, two new nullable columns.
-- ============================================================

alter table public.youth_consents
  add column if not exists form_file_path text,       -- object key in the consent-forms bucket (null = no file attached)
  add column if not exists form_file_name text;        -- original filename, for display

-- Private bucket — these can be scans of a signed paper form, so unlike photos/content-images
-- this is NOT public read. Only youthLeader can read or write, same as the youth_consents table itself.
insert into storage.buckets (id, name, public)
values ('consent-forms', 'consent-forms', false)
on conflict (id) do nothing;

drop policy if exists "consent_forms_youthleader_read" on storage.objects;
create policy "consent_forms_youthleader_read" on storage.objects
  for select using (bucket_id = 'consent-forms' and public.has_permission('youthLeader'));

drop policy if exists "consent_forms_youthleader_insert" on storage.objects;
create policy "consent_forms_youthleader_insert" on storage.objects
  for insert with check (bucket_id = 'consent-forms' and public.has_permission('youthLeader'));

drop policy if exists "consent_forms_youthleader_update" on storage.objects;
create policy "consent_forms_youthleader_update" on storage.objects
  for update using (bucket_id = 'consent-forms' and public.has_permission('youthLeader'));

drop policy if exists "consent_forms_youthleader_delete" on storage.objects;
create policy "consent_forms_youthleader_delete" on storage.objects
  for delete using (bucket_id = 'consent-forms' and public.has_permission('youthLeader'));
