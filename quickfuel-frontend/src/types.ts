export type Role = "admin" | "station_owner" | "operator" | "driver";

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  car_class_id: string | null;
  weekly_reserved_liters: number;
  assigned_station_id: string | null;
  car_classes?: { id: string; name: string; weekly_limit: number } | null;
}

export interface FuelType {
  id: string;
  name: string;
  base_price: number;
}

export interface InventoryRow {
  fuel_type_id: string;
  current_stock: number;
  threshold: number;
  custom_price: number | null;
  fuel_types?: { name: string };
}

export interface Station {
  id: string;
  name: string;
  address?: string;
  verified: boolean;
  station_fuel_inventory?: InventoryRow[];
}

export type ReservationStatus =
  | "confirmed" | "dispensing" | "completed" | "expired" | "pending_refund" | "refunded" | "cancelled";

export interface Reservation {
  id: string;
  pickup_code: string;
  quantity: number;
  total_price: number;
  refund_amount: number | null;
  status: ReservationStatus;
  fuel_type_id: string;
  created_at: string;
  stations?: { name: string };
  fuel_types?: { name: string };
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}
