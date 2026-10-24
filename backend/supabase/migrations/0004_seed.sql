insert into car_classes (name, weekly_limit) values
  ('Motorcycle', 15),
  ('Sedan', 60),
  ('Bus', 200)
on conflict (name) do nothing;

insert into fuel_types (name, base_price) values
  ('Petrol', 135.75),
  ('Diesel', 58.00),
  ('Premium Gasoline', 115.40),
  ('Kerosene', 123.75),
  ('Benzene', 130.87)
on conflict (name) do nothing;
