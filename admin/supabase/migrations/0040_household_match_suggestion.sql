-- ============================================================
-- 0040_household_match_suggestion.sql — Kevin, 2026-09-30: the household-matching
-- flow gets a third tier. Exact match (email or phone+last name) still links
-- automatically. No match at all still creates a new household. A "similar but not
-- exact" match (same last name, nothing else matching) now surfaces as a suggestion
-- instead of silently merging OR silently creating a duplicate:
--   - Admin "Add/Edit Student" (a real person is present) asks right then which to do.
--   - The public New Student form (nobody's there to ask) creates a new household, the
--     safe default, but records the possible match here so staff can review and merge
--     later if it really is the same family.
-- ============================================================

alter table public.youth_students
  add column if not exists possible_duplicate_family_id uuid references public.congregant_families(id) on delete set null;
