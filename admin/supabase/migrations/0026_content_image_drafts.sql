-- Content Editor photo swaps get real persistence, the same "saved as a draft" way text edits
-- already do. A swapped photo is uploaded to its own storage bucket and recorded on the image's
-- row in site_content_images. Nothing here touches the live site — Publish (separate, not built
-- yet) is what will later turn a draft into the real page.
--
-- Additive only: four new nullable columns and one new bucket. No existing row, column, policy or
-- bucket is changed. Safe to run more than once.

alter table public.site_content_images
  add column if not exists replacement_path text,           -- object key in the content-images bucket (null = no swap saved)
  add column if not exists replacement_original_name text,  -- the filename the staff member uploaded (shown in the change log)
  add column if not exists replaced_at timestamptz,
  add column if not exists replaced_by text;

-- Public read (the editor preview and, later, Publish need to fetch it); writes need the
-- Content Editor permission — same has_permission() rule the content tables already use.
insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', true)
on conflict (id) do nothing;

drop policy if exists "content_images_public_read" on storage.objects;
create policy "content_images_public_read" on storage.objects
  for select using (bucket_id = 'content-images');

drop policy if exists "content_images_editor_insert" on storage.objects;
create policy "content_images_editor_insert" on storage.objects
  for insert with check (bucket_id = 'content-images' and public.has_permission('contentEditor'));

drop policy if exists "content_images_editor_update" on storage.objects;
create policy "content_images_editor_update" on storage.objects
  for update using (bucket_id = 'content-images' and public.has_permission('contentEditor'));

drop policy if exists "content_images_editor_delete" on storage.objects;
create policy "content_images_editor_delete" on storage.objects
  for delete using (bucket_id = 'content-images' and public.has_permission('contentEditor'));
