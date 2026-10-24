-- QuickFuel core schema
create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";

create type user_role as enum ('admin','station_owner','operator','driver');
create type reservation_status as enum ('confirmed','dispensing','completed','expired','pending_refund','refunded','cancelled');
create type payment_provider as enum ('telebirr','chapa');
create type payment_status as enum ('pending','success','failed');
create type slot_status as enum ('open','closed');

create table car_classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  weekly_limit numeric not null check (weekly_limit > 0)
);

-- one row per auth.users id; created by the create-user edge function
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  role user_role not null,
  car_class_id uuid references car_classes(id),
  weekly_reserved_liters numeric not null default 0,
  assigned_station_id uuid, -- set for operators; FK added after stations exists
  created_at timestamptz not null default now()
);

create table fuel_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  base_price numeric not null check (base_price >= 0)
);

create table stations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  latitude double precision not null,
  longitude double precision not null,
  license text,
  operating_hours text,
  pumps int default 1,
  owner_id uuid not null references profiles(id),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles add constraint profiles_assigned_station_fk
  foreign key (assigned_station_id) references stations(id);

create table station_fuel_inventory (
  station_id uuid not null references stations(id) on delete cascade,
  fuel_type_id uuid not null references fuel_types(id),
  current_stock numeric not null default 0 check (current_stock >= 0),
  threshold numeric not null default 500,
  custom_price numeric,
  primary key (station_id, fuel_type_id)
);

create table time_slots (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references stations(id) on delete cascade,
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  capacity int not null default 72,
  booked int not null default 0,
  status slot_status not null default 'open',
  unique (station_id, slot_date, start_time)
);

create table reservations (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references profiles(id),
  station_id uuid not null references stations(id),
  fuel_type_id uuid not null references fuel_types(id),
  slot_id uuid not null references time_slots(id),
  quantity numeric not null check (quantity >= 5 and quantity <= 200),
  pickup_code text not null unique,
  status reservation_status not null default 'confirmed',
  total_price numeric not null,
  refund_amount numeric,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id) on delete cascade,
  amount numeric not null,
  provider payment_provider not null,
  status payment_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table fuel_dispensing_logs (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id),
  operator_id uuid not null references profiles(id),
  dispensed_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table system_activity (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

create index on reservations (driver_id);
create index on reservations (station_id, status);
create index on time_slots (station_id, slot_date, status);
create index on station_fuel_inventory (station_id);
