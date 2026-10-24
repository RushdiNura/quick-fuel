create or replace function increment_slot_booked(p_slot_id uuid) returns void
language sql as $$
  update time_slots set booked = booked + 1 where id = p_slot_id;
$$;
