-- Fix infinite RLS recursion in policies that call current_role_is().
-- The previous helper queried public.profiles as the caller, which caused
-- profiles policies to invoke themselves recursively and return HTTP 500.
-- Run as the migration owner (normally postgres) so SECURITY DEFINER bypasses RLS.

create or replace function public.current_role_is(r public.user_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = r
  );
$$;

-- Policies need to execute this helper for browser-authenticated users.
revoke all on function public.current_role_is(public.user_role) from public;
grant execute on function public.current_role_is(public.user_role) to anon, authenticated, service_role;
