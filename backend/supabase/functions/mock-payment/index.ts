// POST /mock-payment  { reservation_id, provider }  provider: "telebirr" | "chapa"
// Simulates a payment gateway. No real money moves. Marks the payment as
// successful and sends the driver a confirmation notification.
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
  const { reservation_id, provider } = await req.json();
  if (!["telebirr", "chapa"].includes(provider)) return json({ error: "Unknown provider" }, 400);

  const { data: reservation } = await db.from("reservations")
    .select("id, driver_id, total_price, status, pickup_code").eq("id", reservation_id).single();
  if (!reservation || reservation.driver_id !== user.id) return json({ error: "Reservation not found" }, 404);
  if (reservation.status !== "confirmed") return json({ error: "Reservation is not payable" }, 400);

  await db.from("payments").insert({
    reservation_id, amount: reservation.total_price, provider, status: "success",
  });
  await db.from("notifications").insert({
    user_id: user.id, title: "Reservation confirmed",
    body: `Your pickup code is ${reservation.pickup_code}.`,
  });
  await db.from("system_activity").insert({
    actor_id: user.id, action: "mock_payment", details: { reservation_id, provider },
  });

  return json({ pickupCode: reservation.pickup_code, status: "confirmed" });
});
