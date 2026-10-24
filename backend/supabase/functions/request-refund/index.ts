// POST /request-refund  { reservation_id }
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

const SERVICE_FEE = 0.08;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") ?? "";
  const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await anon.auth.getUser();
  if (!user) return json({ error: "Not authenticated" }, 401);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { reservation_id } = await req.json();

  const { data: reservation } = await db.from("reservations")
    .select("id, driver_id, status, total_price, station_id").eq("id", reservation_id).single();
  if (!reservation || reservation.driver_id !== user.id) return json({ error: "Reservation not found" }, 404);
  if (reservation.status !== "expired") return json({ error: "Only expired reservations are refundable" }, 400);

  const refundAmount = +(reservation.total_price * (1 - SERVICE_FEE)).toFixed(2);
  const { error } = await db.from("reservations")
    .update({ status: "pending_refund", refund_amount: refundAmount }).eq("id", reservation_id);
  if (error) return json({ error: error.message }, 400);
  await db.from("system_activity").insert({
    actor_id: user.id, action: "request_refund", details: { reservation_id, refundAmount },
  });

  const { data: station } = await db.from("stations").select("owner_id").eq("id", reservation.station_id).single();
  if (station?.owner_id) {
    await db.from("notifications").insert({
      user_id: station.owner_id, title: "Refund requested", body: `Reservation ${reservation_id} needs review.`,
    });
  }

  return json({ status: "pending_refund", refundAmount });
});
