-- Content Editor gets real persistence for the first time. site_content_fields/
-- images/repeats (0001) already store WHAT belongs to each (page, section_name) —
-- this migration adds the missing piece: section ORDER within a page (the mock's
-- pageContent[page] was an array; order mattered), plus a structured change log
-- (richer than the generic activity_log — the UI shows old/new value per field).

create table public.site_content_sections (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  section_name text not null,
  sort_order int not null default 0
);
alter table public.site_content_sections enable row level security;
create policy "site_content_sections_rw" on public.site_content_sections
  for all using (public.has_permission('contentEditor'))
  with check (public.has_permission('contentEditor'));
grant select, insert, update, delete on public.site_content_sections to authenticated, service_role;

create table public.content_change_log (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_name text not null,
  actor_email text not null default '',
  page text not null,
  section text not null default '',
  field text not null,
  old_value text not null default '',
  new_value text not null default ''
);
alter table public.content_change_log enable row level security;
create policy "content_change_log_rw" on public.content_change_log
  for all using (public.has_permission('contentEditor'))
  with check (public.has_permission('contentEditor'));
grant select, insert, update, delete on public.content_change_log to authenticated, service_role;
