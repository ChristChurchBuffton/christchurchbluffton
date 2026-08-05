-- Storage bucket for real church photos (replaces base64-in-localStorage).
-- Public read so the existing christchurchbluffton.org/a34317d8 live-URL pattern
-- keeps working unauthenticated; writes require photos permission.

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "photos_bucket_public_read" on storage.objects
  for select using (bucket_id = 'photos');

create policy "photos_bucket_authenticated_write" on storage.objects
  for insert with check (bucket_id = 'photos' and public.has_permission('photos'));

create policy "photos_bucket_authenticated_update" on storage.objects
  for update using (bucket_id = 'photos' and public.has_permission('photos'));

create policy "photos_bucket_authenticated_delete" on storage.objects
  for delete using (bucket_id = 'photos' and public.has_permission('photos'));
