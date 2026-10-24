import { supabase, SUPABASE_URL } from "./supabase";

class ApiError extends Error {}

async function callFn<T = any>(name: string, body: Record<string, unknown> = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new ApiError("Not signed in");
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  });
  const out = await res.json();
  if (!res.ok) throw new ApiError(out.error || `Request to ${name} failed`);
  return out as T;
}

export const api = {
  createUser: (body: { name: string; email: string; role: string; car_class_id?: string; assigned_station_id?: string }) =>
    callFn<{ userId: string; tempPassword: string }>("create-user", body),

  createStation: (body: {
    name: string; address?: string; latitude: number; longitude: number; license?: string;
    operating_hours?: string; pumps?: number; owner_id: string;
    inventory: { fuel_type_id: string; current_stock: number; threshold?: number }[];
  }) => callFn<{ stationId: string }>("create-station", body),

  reserve: (body: { station_id: string; fuel_type_id: string; slot_id: string; quantity: number }) =>
    callFn<{ reservationId: string; pickupCode: string; totalPrice: number }>("reserve", body),

  mockPayment: (body: { reservation_id: string; provider: "telebirr" | "chapa" }) =>
    callFn<{ pickupCode: string; status: string }>("mock-payment", body),

  verifyCode: (body: { code: string }) => callFn<{ reservation: any }>("verify-code", body),

  dispenseAuthorise: (body: { reservation_id: string }) => callFn<{ status: string }>("dispense-authorise", body),

  dispenseComplete: (body: { reservation_id: string }) => callFn<{ status: string }>("dispense-complete", body),

  requestRefund: (body: { reservation_id: string }) => callFn<{ status: string; refundAmount: number }>("request-refund", body),

  approveRefund: (body: { reservation_id: string; decision: "approve" | "reject" }) =>
    callFn<{ status: string }>("approve-refund", body),
};

export { ApiError };
