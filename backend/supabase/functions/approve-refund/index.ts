// POST /approve-refund  { reservation_id, decision }  decision: "approve" | "reject"
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
  const { reservation_id, decision } = await req.json();
  if (!["approve", "reject"].includes(decision)) return json({ error: "decision must be approve or reject" }, 400);

  const { data: reservation } = await db.from("reservations")
    .select("id, status, station_id, driver_id").eq("id", reservation_id).single();
  if (!reservation || reservation.status !== "pending_refund") {
    return json({ error: "No pending refund for this reservation" }, 400);
  }

  const { data: caller } = await db.from("profiles").select("role").eq("id", user.id).single();
  const { data: station } = await db.from("stations").select("owner_id").eq("id", reservation.station_id).single();
  const authorised = caller?.role === "admin" || station?.owner_id === user.id;
  if (!authorised) return json({ error: "Not authorised to approve this refund" }, 403);

  const newStatus = decision === "approve" ? "refunded" : "expired";
  const { error } = await db.from("reservations").update({ status: newStatus }).eq("id", reservation_id);
  if (error) return json({ error: error.message }, 400);

  await db.from("notifications").insert({
    user_id: reservation.driver_id,
    title: decision === "approve" ? "Refund approved" : "Refund rejected",
    body: `Your refund request for reservation ${reservation_id} was ${decision === "approve" ? "approved" : "rejected"}.`,
  });
  await db.from("system_activity").insert({
    actor_id: user.id, action: "approve_refund", details: { reservation_id, decision },
  });

  return json({ status: newStatus });
});
