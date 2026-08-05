-- Let a signed-in user update their OWN profile row (name, status) — needed for
-- Account Settings (self password/name change) and the forced first-login
-- password reset flow. A trigger pins role/permissions/email back to their
-- existing value on any update NOT made by an admin, so a non-admin can never
-- self-escalate via a raw REST call even though the row-level policy allows
-- them into their own row.

create policy "profiles_update_own_row" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.prevent_self_privilege_escalation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.permissions := old.permissions;
    new.email := old.email;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_self_privilege_escalation
  before update on public.profiles
  for each row execute function public.prevent_self_privilege_escalation();
