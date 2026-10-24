// POST /verify-code  { code }
// Caller must be an operator. Returns reservation details if the code is
// valid, unexpired, and belongs to the operator's assigned station.
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
  if (!(await withinRateLimit(db, user.id, "verify-code", 20, 60))) {
    return json({ error: "Too many attempts. Please wait a moment." }, 429);
  }
  const { data: operator } = await db.from("profiles").select("role, assigned_station_id").eq("id", user.id).single();
  if (operator?.role !== "operator" || !operator.assigned_station_id) return json({ error: "Operator only" }, 403);

  const { code } = await req.json();
  const { data: reservation } = await db.from("reservations")
    .select("id, status, quantity, fuel_type_id, station_id, expires_at, fuel_types(name)")
    .eq("pickup_code", code).eq("station_id", operator.assigned_station_id).single();

  if (!reservation) return json({ error: "Invalid code for this station" }, 404);
  if (new Date(reservation.expires_at) < new Date() && reservation.status === "confirmed") {
    await db.from("reservations").update({ status: "expired" }).eq("id", reservation.id);
    return json({ error: "This reservation has expired" }, 400);
  }
  if (!["confirmed", "dispensing"].includes(reservation.status)) {
    return json({ error: `Reservation is ${reservation.status}, cannot dispense` }, 400);
  }

  return json({ reservation });
});
