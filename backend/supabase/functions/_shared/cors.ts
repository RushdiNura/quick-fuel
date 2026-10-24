export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Checks + records a hit against the check_rate_limit() RPC (see migration 0006).
// Returns true if the caller is within limits, false if they should be throttled.
export async function withinRateLimit(
  db: any, userId: string, action: string, max: number, windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await db.rpc("check_rate_limit", {
    p_user: userId, p_action: action, p_max: max, p_window_seconds: windowSeconds,
  });
  if (error) return true; // fail open rather than blocking legitimate traffic on an infra hiccup
  return !!data;
}
