-- ============================================================
-- 0033_youth_student_seq_grant.sql — fixes a real gap found by testing 0030 directly: table
-- grants don't cover a sequence used in a column default. Even service_role (which bypasses
-- row-level security) still needs an explicit grant to use a plain Postgres sequence — RLS and
-- object grants are two separate things. Without this, every insert into youth_students failed
-- ("permission denied for sequence youth_student_seq"), confirmed live before this fix.
-- ============================================================

grant usage, select on sequence public.youth_student_seq to authenticated, service_role;
