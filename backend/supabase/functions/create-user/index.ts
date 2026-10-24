// POST /create-user  { name, email, phone, role, car_class_id?, assigned_station_id? }
// Caller must be an authenticated admin. Creates the auth user + profile row
// and returns a temporary password (swap for an email invite in production).
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

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: caller } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (caller?.role !== "admin") return json({ error: "Admin only" }, 403);

  const body = await req.json();
  const { name, email, phone, role, car_class_id, assigned_station_id } = body;
  if (!name || !email || !role) return json({ error: "name, email and role are required" }, 400);
  if (role === "driver" && !car_class_id) return json({ error: "Drivers require a car_class_id" }, 400);

  const tempPassword = crypto.randomUUID().slice(0, 10);
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email, password: tempPassword, email_confirm: true,
  });
  if (createErr) return json({ error: createErr.message }, 400);

  const { error: profileErr } = await admin.from("profiles").insert({
    id: created.user.id, name, email, phone, role,
    car_class_id: role === "driver" ? car_class_id : null,
    assigned_station_id: role === "operator" ? assigned_station_id ?? null : null,
  });
  if (profileErr) {
    await admin.auth.admin.deleteUser(created.user.id); // roll back the auth user
    return json({ error: profileErr.message }, 400);
  }

  await admin.from("system_activity").insert({
    actor_id: user.id, action: "create_user", details: { role, email },
  });

  return json({ userId: created.user.id, tempPassword });
});
