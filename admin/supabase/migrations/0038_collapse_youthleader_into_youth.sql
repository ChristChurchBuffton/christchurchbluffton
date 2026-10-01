-- ============================================================
-- 0038_collapse_youthleader_into_youth.sql — Kevin, 2026-09-30: "i dont want youth
-- leader medical/consent. all should be only youth." Removes the stricter
-- 'youthLeader' permission tier entirely — anyone with plain 'youth' now sees
-- grade/notes/consent, same as the roster itself. Policy-only change (no data
-- moved); the 'youthLeader' key itself was removed from src/admin/js/shared.js
-- in the same pass, so nothing can be granted it going forward.
-- ============================================================

drop policy if exists "youth_student_details_rw" on public.youth_student_details;
create policy "youth_student_details_rw" on public.youth_student_details
  for all using (public.has_permission('youth'))
  with check (public.has_permission('youth'));

drop policy if exists "youth_consents_rw" on public.youth_consents;
create policy "youth_consents_rw" on public.youth_consents
  for all using (public.has_permission('youth'))
  with check (public.has_permission('youth'));

drop policy if exists "youth_consent_terms_select" on public.youth_consent_terms;
create policy "youth_consent_terms_select" on public.youth_consent_terms
  for select using (public.has_permission('youth'));

drop policy if exists "youth_consent_terms_write" on public.youth_consent_terms;
create policy "youth_consent_terms_write" on public.youth_consent_terms
  for update using (public.has_permission('youth')) with check (public.has_permission('youth'));

drop policy if exists "consent_forms_youthleader_read" on storage.objects;
drop policy if exists "consent_forms_youth_read" on storage.objects;
create policy "consent_forms_youth_read" on storage.objects
  for select using (bucket_id = 'consent-forms' and public.has_permission('youth'));

drop policy if exists "consent_forms_youthleader_insert" on storage.objects;
drop policy if exists "consent_forms_youth_insert" on storage.objects;
create policy "consent_forms_youth_insert" on storage.objects
  for insert with check (bucket_id = 'consent-forms' and public.has_permission('youth'));

drop policy if exists "consent_forms_youthleader_update" on storage.objects;
drop policy if exists "consent_forms_youth_update" on storage.objects;
create policy "consent_forms_youth_update" on storage.objects
  for update using (bucket_id = 'consent-forms' and public.has_permission('youth'));

drop policy if exists "consent_forms_youthleader_delete" on storage.objects;
drop policy if exists "consent_forms_youth_delete" on storage.objects;
create policy "consent_forms_youth_delete" on storage.objects
  for delete using (bucket_id = 'consent-forms' and public.has_permission('youth'));
