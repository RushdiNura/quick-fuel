// POST /create-station
// { name, address, latitude, longitude, license, operating_hours, pumps, owner_id,
//   inventory: [{ fuel_type_id, current_stock, threshold? }] }
// Admin only. Creates the station (unverified by default) plus its starting
// inventory rows. Verification is a separate step (PATCH stations.verified).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") ?? "";
  const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await anon.auth.getUser();
  if (!user) return json({ error: "Not authenticated" }, 401);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: caller } = await db.from("profiles").select("role").eq("id", user.id).single();
  if (caller?.role !== "admin") return json({ error: "Admin only" }, 403);

  const body = await req.json();
  const { name, address, latitude, longitude, license, operating_hours, pumps, owner_id, inventory } = body;
  if (!name || latitude == null || longitude == null || !owner_id) {
    return json({ error: "name, latitude, longitude and owner_id are required" }, 400);
  }
  const { data: owner } = await db.from("profiles").select("role").eq("id", owner_id).single();
  if (owner?.role !== "station_owner") return json({ error: "owner_id must belong to a station_owner" }, 400);

  const { data: station, error } = await db.from("stations").insert({
    name, address, latitude, longitude, license, operating_hours,
    pumps: pumps ?? 1, owner_id, verified: false,
  }).select().single();
  if (error) return json({ error: error.message }, 400);

  if (Array.isArray(inventory) && inventory.length) {
    const rows = inventory
      .filter((i: any) => i.fuel_type_id && i.current_stock != null)
      .map((i: any) => ({
        station_id: station.id, fuel_type_id: i.fuel_type_id,
        current_stock: i.current_stock, threshold: i.threshold ?? 500,
      }));
    if (rows.length) {
      const { error: invErr } = await db.from("station_fuel_inventory").insert(rows);
      if (invErr) return json({ error: `Station created but inventory failed: ${invErr.message}` }, 400);
    }
  }

  await db.from("system_activity").insert({
    actor_id: user.id, action: "create_station", details: { station_id: station.id, name },
  });

  return json({ stationId: station.id });
});
