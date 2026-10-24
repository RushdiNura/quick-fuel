create table rate_limit_hits (
  id bigserial primary key,
  user_id uuid not null,
  action text not null,
  created_at timestamptz not null default now()
);
create index on rate_limit_hits (user_id, action, created_at);

-- Returns true and logs a hit if the user is under the limit; false if throttled.
-- Also prunes hits older than the window so the table doesn't grow unbounded.
create or replace function check_rate_limit(p_user uuid, p_action text, p_max int, p_window_seconds int)
returns boolean language plpgsql as $$
declare cnt int;
begin
  delete from rate_limit_hits where created_at < now() - (p_window_seconds || ' seconds')::interval;
  select count(*) into cnt from rate_limit_hits
    where user_id = p_user and action = p_action
      and created_at > now() - (p_window_seconds || ' seconds')::interval;
  if cnt >= p_max then
    return false;
  end if;
  insert into rate_limit_hits (user_id, action) values (p_user, p_action);
  return true;
end; $$;

-- keep the table itself small even without traffic
select cron.schedule('prune-rate-limits', '0 * * * *',
  $$delete from rate_limit_hits where created_at < now() - interval '1 hour';$$);
