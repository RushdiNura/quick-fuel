-- Generate hourly slots for the next 7 days for every verified station.
create or replace function generate_time_slots() returns void
language plpgsql as $$
declare s record; d date; h int;
begin
  for s in select id from stations where verified = true loop
    for d in select generate_series(current_date, current_date + interval '6 days', interval '1 day')::date loop
      for h in 6..21 loop
        insert into time_slots (station_id, slot_date, start_time, end_time)
        values (s.id, d, make_time(h,0,0), make_time(h+1,0,0))
        on conflict (station_id, slot_date, start_time) do nothing;
      end loop;
    end loop;
  end loop;
end; $$;

-- Reservations expire 15 minutes after their slot's end time.
create or replace function expire_reservations() returns void
language plpgsql as $$
begin
  update reservations r
  set status = 'expired'
  from time_slots t
  where r.slot_id = t.id
    and r.status = 'confirmed'
    and (t.slot_date + t.end_time + interval '15 minutes') < now();
end; $$;

-- Close slots whose date/time has passed.
create or replace function close_passed_slots() returns void
language plpgsql as $$
begin
  update time_slots
  set status = 'closed'
  where status = 'open'
    and (slot_date + end_time) < now();
end; $$;

-- Reset every driver's rolling weekly usage. Called Monday 00:00 UTC.
create or replace function reset_weekly_quota() returns void
language plpgsql as $$
begin
  update profiles set weekly_reserved_liters = 0 where role = 'driver';
end; $$;

select cron.schedule('generate-time-slots', '0 0 * * *', 'select generate_time_slots();');
select cron.schedule('expire-reservations', '*/15 * * * *', 'select expire_reservations();');
select cron.schedule('close-passed-slots', '0 * * * *', 'select close_passed_slots();');
select cron.schedule('reset-weekly-quota', '0 0 * * 1', 'select reset_weekly_quota();');
