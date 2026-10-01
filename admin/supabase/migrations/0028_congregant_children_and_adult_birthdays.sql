-- ============================================================
-- 0028_congregant_children_and_adult_birthdays.sql
--
-- Workflow 6, Step 1 (cleanup): the Congregation data model's children were
-- stored as one jsonb array on congregant_families — fine for display, but
-- the wrong shape once a child needs to be their own record (a youth Student
-- ID + attendance history need to link to ONE real row, not an entry inside
-- someone else's blob — "store each person once ... never a copy", per the
-- Workflow 6 brief). This gives each child a real row instead.
--
-- Also adds the adult birthday field the brief asks for (month/day only —
-- children already had a full birthdate in the old jsonb).
--
-- Safety: the old `children` column is RENAMED to `children_legacy`, never
-- dropped — per this project's "ask before any destructive change" rule.
-- The data migration below is inside one transaction with a row-count check
-- that aborts (raises an exception, rolling back everything) if the copy
-- didn't move every child, so this can never half-apply or silently lose data.
-- ============================================================

-- ---- 1) the new table ----
create table public.congregant_children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.congregant_families(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  birthdate date,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index congregant_children_family_id_idx on public.congregant_children(family_id);

alter table public.congregant_children enable row level security;
create policy "congregant_children_rw" on public.congregant_children
  for all using (public.has_permission('congregants'))
  with check (public.has_permission('congregants'));
grant select, insert, update, delete on public.congregant_children to authenticated, service_role;

-- ---- 2) move the data ----
-- Only rows that actually hold an array move anything; a null/empty column is a no-op.
insert into public.congregant_children (family_id, first_name, last_name, birthdate, sort_order)
select
  f.id,
  coalesce(child->>'firstName', ''),
  coalesce(child->>'lastName', ''),
  nullif(child->>'birthdate', '')::date,
  ord - 1
from public.congregant_families f,
     jsonb_array_elements(f.children) with ordinality as elems(child, ord)
where jsonb_typeof(f.children) = 'array';

do $$
declare
  legacy_count int;
  moved_count int;
begin
  select coalesce(sum(jsonb_array_length(children)), 0) into legacy_count
  from public.congregant_families where jsonb_typeof(children) = 'array';
  select count(*) into moved_count from public.congregant_children;
  if legacy_count <> moved_count then
    raise exception 'congregant_children migration mismatch: % children in the old jsonb column but % rows moved — rolling back, nothing changed.', legacy_count, moved_count;
  end if;
end $$;

-- ---- 3) keep the old data as a labeled backup, not deleted ----
alter table public.congregant_families rename column children to children_legacy;
comment on column public.congregant_families.children_legacy is
  'Superseded by public.congregant_children (migration 0028). Kept as a backup only — the admin UI no longer reads or writes this column.';

-- ---- 4) adult birthdays (month/day only, per the brief) ----
alter table public.congregant_families
  add column head_birth_month smallint check (head_birth_month between 1 and 12),
  add column head_birth_day smallint check (head_birth_day between 1 and 31),
  add column spouse_birth_month smallint check (spouse_birth_month between 1 and 12),
  add column spouse_birth_day smallint check (spouse_birth_day between 1 and 31);
