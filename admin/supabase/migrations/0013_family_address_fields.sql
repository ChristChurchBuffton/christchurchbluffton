-- ============================================================
-- 0013_family_address_fields.sql — splits the single free-text
-- `address` column on congregant_families into street/city/state/zip
-- so the Add/Edit Family modal can show them as separate fields
-- instead of one line. `address` is kept as the street-only line;
-- existing rows just have city/state/zip blank until edited.
-- ============================================================

alter table public.congregant_families
  add column city text,
  add column state text,
  add column zip text;
