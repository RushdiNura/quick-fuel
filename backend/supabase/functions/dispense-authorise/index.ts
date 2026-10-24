// PUT /dispense-authorise  { reservation_id }
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
  const { data: operator } = await db.from("profiles").select("role, assigned_station_id").eq("id", user.id).single();
  if (operator?.role !== "operator") return json({ error: "Operator only" }, 403);

  const { reservation_id } = await req.json();
  const { data: reservation } = await db.from("reservations")
    .select("id, status, station_id").eq("id", reservation_id).single();
  if (!reservation || reservation.station_id !== operator.assigned_station_id) {
    return json({ error: "Reservation not found at your station" }, 404);
  }
  if (reservation.status !== "confirmed") return json({ error: "Reservation must be confirmed to authorise" }, 400);

  const { error } = await db.from("reservations").update({ status: "dispensing" }).eq("id", reservation_id);
  if (error) return json({ error: error.message }, 400);
  await db.from("system_activity").insert({
    actor_id: user.id, action: "dispense_authorise", details: { reservation_id },
  });

  return json({ status: "dispensing" });
});
