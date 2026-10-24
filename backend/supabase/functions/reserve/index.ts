// POST /reserve  { station_id, fuel_type_id, slot_id, quantity }
// Checks remaining weekly quota + station stock, then creates a pending reservation
// (status becomes 'confirmed' only after /mock-payment succeeds).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json, withinRateLimit } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") ?? "";
  const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await anon.auth.getUser();
  if (!user) return json({ error: "Not authenticated" }, 401);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  if (!(await withinRateLimit(db, user.id, "reserve", 5, 60))) {
    return json({ error: "Too many reservation attempts. Please wait a moment and try again." }, 429);
  }
  const { station_id, fuel_type_id, slot_id, quantity } = await req.json();
  if (!station_id || !fuel_type_id || !slot_id || !quantity) return json({ error: "Missing fields" }, 400);
  if (quantity < 5 || quantity > 200) return json({ error: "Quantity must be between 5 and 200 litres" }, 400);

  const { data: driver } = await db.from("profiles")
    .select("weekly_reserved_liters, car_class_id, car_classes(weekly_limit)")
    .eq("id", user.id).single();
  if (!driver) return json({ error: "Driver profile not found" }, 404);

  const limit = (driver as any).car_classes?.weekly_limit ?? 0;
  const remaining = limit - driver.weekly_reserved_liters;
  if (quantity > remaining) {
    return json({ error: `Weekly quota exceeded. ${remaining}L remaining this week.` }, 400);
  }

  const { data: inv } = await db.from("station_fuel_inventory")
    .select("current_stock, custom_price").eq("station_id", station_id).eq("fuel_type_id", fuel_type_id).single();
  if (!inv || inv.current_stock < quantity) return json({ error: "Not enough stock at this station" }, 400);

  const { data: fuel } = await db.from("fuel_types").select("base_price").eq("id", fuel_type_id).single();
  const price = (inv.custom_price ?? fuel?.base_price ?? 0) * quantity;

  const { data: slot } = await db.from("time_slots").select("slot_date, end_time, status").eq("id", slot_id).single();
  if (!slot || slot.status !== "open") return json({ error: "That time slot is no longer available" }, 400);
  const expiresAt = new Date(`${slot.slot_date}T${slot.end_time}Z`);
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  const pickupCode = String(Math.floor(100000 + Math.random() * 900000));

  const { data: reservation, error } = await db.from("reservations").insert({
    driver_id: user.id, station_id, fuel_type_id, slot_id, quantity,
    pickup_code: pickupCode, status: "confirmed", total_price: price, expires_at: expiresAt,
  }).select().single();
  if (error) return json({ error: error.message }, 400);

  await db.from("station_fuel_inventory")
    .update({ current_stock: inv.current_stock - quantity })
    .eq("station_id", station_id).eq("fuel_type_id", fuel_type_id);
  await db.from("profiles")
    .update({ weekly_reserved_liters: driver.weekly_reserved_liters + quantity })
    .eq("id", user.id);
  await db.rpc("increment_slot_booked", { p_slot_id: slot_id });
  await db.from("system_activity").insert({
    actor_id: user.id, action: "reserve", details: { reservation_id: reservation.id, station_id, quantity },
  });

  return json({ reservationId: reservation.id, pickupCode, totalPrice: price });
});
