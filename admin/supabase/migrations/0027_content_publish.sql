-- ============================================================
-- 0027_content_publish.sql — Content Editor: who can save, and what Publish needs to remember.
--
-- 1) WHO CAN SAVE. Editing site content (text, photos, the change log) is limited to top admins:
--    role 'site_admin' whose Content Editor access hasn't been turned off. Everyone who already
--    has the Content Editor permission can still LOOK at the records (select), but can no longer
--    write them. Enforced here in the database, not just on screen.
-- 2) PUBLISH TRACKING. Publish copies saved text/photos into the real page files. Each record
--    remembers what it last published, so the next Publish replaces the right text (not the
--    original wording that is no longer on the page) and the editor can show which pages still
--    have unpublished changes.
-- 3) EDIT CONFLICTS. A version number on each record, bumped when its content changes, lets the
--    editor notice that someone else saved the same box first instead of silently overwriting it.
--
-- Additive except for step 1's policy swap. Safe to run more than once.
-- ============================================================

-- ---- 1) who can save ----
create or replace function public.can_edit_content() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'site_admin'
      and coalesce(permissions->>'contentEditor', 'true') <> 'false'
  );
$$;

do $$
declare t text;
begin
  foreach t in array array['site_content_fields','site_content_images','site_content_repeats','site_content_sections','content_change_log']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_rw', t);
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format('create policy %I on public.%I for select using (public.has_permission(''contentEditor''))', t || '_select', t);
    execute format('create policy %I on public.%I for insert with check (public.can_edit_content())', t || '_insert', t);
    execute format('create policy %I on public.%I for update using (public.can_edit_content()) with check (public.can_edit_content())', t || '_update', t);
    execute format('create policy %I on public.%I for delete using (public.can_edit_content())', t || '_delete', t);
  end loop;
end $$;

-- Swapped-photo storage (bucket from 0026): same rule for writing.
drop policy if exists "content_images_editor_insert" on storage.objects;
create policy "content_images_editor_insert" on storage.objects
  for insert with check (bucket_id = 'content-images' and public.can_edit_content());
drop policy if exists "content_images_editor_update" on storage.objects;
create policy "content_images_editor_update" on storage.objects
  for update using (bucket_id = 'content-images' and public.can_edit_content());
drop policy if exists "content_images_editor_delete" on storage.objects;
create policy "content_images_editor_delete" on storage.objects
  for delete using (bucket_id = 'content-images' and public.can_edit_content());

-- ---- 2) publish tracking ----
alter table public.site_content_fields
  add column if not exists published_value text;            -- the exact HTML last published for this box (null = never)
alter table public.site_content_images
  add column if not exists replacement_variants jsonb,       -- [{file, path}] — every size of a swapped photo (page uses srcset)
  add column if not exists published_replacement_path text;  -- which swap is currently on the real page (null = original photo)
-- Repeated-card records keep their published state inside their own jsonb (fields[].published,
-- image.published_replacement_path), so they need no new columns.

create table if not exists public.content_publish_log (
  id uuid primary key default gen_random_uuid(),
  published_at timestamptz not null default now(),
  published_by text not null default '',
  page text not null,
  target text not null default 'temp',
  commit_sha text,
  commit_url text,
  changes int not null default 0,
  summary text not null default ''
);
alter table public.content_publish_log enable row level security;
drop policy if exists "content_publish_log_select" on public.content_publish_log;
create policy "content_publish_log_select" on public.content_publish_log
  for select using (public.has_permission('contentEditor'));
-- No insert/update/delete policy on purpose: only the Publish function (service role) writes here.
grant select on public.content_publish_log to authenticated;
grant select, insert, update, delete on public.content_publish_log to service_role;

-- ---- 3) edit-conflict version numbers ----
alter table public.site_content_fields   add column if not exists version int not null default 0;
alter table public.site_content_images   add column if not exists version int not null default 0;
alter table public.site_content_repeats  add column if not exists version int not null default 0;

create or replace function public.bump_content_version() returns trigger
language plpgsql as $$
begin
  if tg_table_name = 'site_content_fields' then
    if new.field_value is distinct from old.field_value then new.version := old.version + 1; end if;
  elsif tg_table_name = 'site_content_repeats' then
    if new.fields is distinct from old.fields or new.image is distinct from old.image then new.version := old.version + 1; end if;
  elsif tg_table_name = 'site_content_images' then
    if new.replacement_path is distinct from old.replacement_path then new.version := old.version + 1; end if;
  end if;
  return new;
end $$;

drop trigger if exists site_content_fields_version on public.site_content_fields;
create trigger site_content_fields_version before update on public.site_content_fields
  for each row execute function public.bump_content_version();
drop trigger if exists site_content_images_version on public.site_content_images;
create trigger site_content_images_version before update on public.site_content_images
  for each row execute function public.bump_content_version();
drop trigger if exists site_content_repeats_version on public.site_content_repeats;
create trigger site_content_repeats_version before update on public.site_content_repeats
  for each row execute function public.bump_content_version();
