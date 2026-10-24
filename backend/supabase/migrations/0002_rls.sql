-- Row Level Security. Edge functions use the service_role key and bypass RLS
-- for privileged writes (user creation, dispensing, refund approval, etc).
-- These policies govern what the browser's anon/authenticated client can do directly.

alter table profiles enable row level security;
alter table car_classes enable row level security;
alter table fuel_types enable row level security;
alter table stations enable row level security;
alter table station_fuel_inventory enable row level security;
alter table time_slots enable row level security;
alter table reservations enable row level security;
alter table payments enable row level security;
alter table fuel_dispensing_logs enable row level security;
alter table notifications enable row level security;
alter table system_activity enable row level security;

create or replace function current_role_is(r user_role) returns boolean
language sql stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = r);
$$;

create or replace function current_profile_id() returns uuid
language sql stable as $$ select auth.uid(); $$;

-- profiles: everyone can read their own row; admin reads all
create policy "profiles_self_select" on profiles for select
  using (id = auth.uid() or current_role_is('admin'));

-- car_classes / fuel_types: public read (needed to show quota + prices), admin write
create policy "car_classes_read" on car_classes for select using (true);
create policy "fuel_types_read" on fuel_types for select using (true);

-- stations: drivers see verified stations only; owners see + manage their own; admin all
create policy "stations_public_read" on stations for select
  using (verified = true or owner_id = auth.uid() or current_role_is('admin'));
create policy "stations_owner_write" on stations for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- inventory: readable if the station is visible; only the owning station_owner can edit
create policy "inventory_read" on station_fuel_inventory for select
  using (exists (select 1 from stations s where s.id = station_id
                 and (s.verified or s.owner_id = auth.uid() or current_role_is('admin'))));
create policy "inventory_owner_write" on station_fuel_inventory for update
  using (exists (select 1 from stations s where s.id = station_id and s.owner_id = auth.uid()));

-- time_slots: readable for any visible station
create policy "slots_read" on time_slots for select
  using (exists (select 1 from stations s where s.id = station_id and s.verified = true));

-- reservations: drivers see only their own; operators see reservations at their station;
-- owners see reservations at stations they own
create policy "reservations_driver_read" on reservations for select
  using (driver_id = auth.uid());
create policy "reservations_operator_read" on reservations for select
  using (exists (select 1 from profiles p where p.id = auth.uid()
                 and p.role = 'operator' and p.assigned_station_id = station_id));
create policy "reservations_owner_read" on reservations for select
  using (exists (select 1 from stations s where s.id = station_id and s.owner_id = auth.uid()));
create policy "reservations_admin_read" on reservations for select
  using (current_role_is('admin'));

-- payments / dispensing logs: visible to the reservation's driver, operator, owner, admin
create policy "payments_read" on payments for select
  using (exists (
    select 1 from reservations r where r.id = reservation_id
    and (r.driver_id = auth.uid()
         or exists (select 1 from stations s where s.id = r.station_id and s.owner_id = auth.uid())
         or exists (select 1 from profiles p where p.id = auth.uid() and p.role='operator' and p.assigned_station_id = r.station_id)
         or current_role_is('admin'))
  ));
create policy "dispensing_logs_read" on fuel_dispensing_logs for select
  using (exists (select 1 from reservations r where r.id = reservation_id and
    (exists (select 1 from stations s where s.id = r.station_id and s.owner_id = auth.uid())
     or current_role_is('admin'))));

-- notifications: only the owner reads/marks their own
create policy "notifications_owner" on notifications for select using (user_id = auth.uid());
create policy "notifications_owner_update" on notifications for update using (user_id = auth.uid());

-- system_activity: admin only
create policy "activity_admin_read" on system_activity for select using (current_role_is('admin'));
