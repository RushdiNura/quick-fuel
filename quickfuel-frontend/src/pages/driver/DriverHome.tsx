import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLang } from "../../contexts/LangContext";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabase";
import { api, ApiError } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { SectionLabel, Card } from "../../components/ui/Card";
import { SchematicMap } from "./SchematicMap";
import { ReservationSheet } from "./ReservationSheet";
import type { Station, FuelType, Reservation } from "../../types";

export default function DriverHome() {
  const { profile, refreshProfile } = useAuth();
  const { t } = useLang();
  const toast = useToast();
  const [stations, setStations] = useState<Station[]>([]);
  const [fuelTypes, setFuelTypes] = useState<Record<string, FuelType>>({});
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [view, setView] = useState<"list" | "map">("list");
  const [reserving, setReserving] = useState<Station | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data: fuels } = await supabase.from("fuel_types").select("id,name,base_price");
    setFuelTypes(Object.fromEntries((fuels || []).map((f: any) => [f.id, f])));
    const { data: st } = await supabase.from("stations")
      .select("id,name,verified,station_fuel_inventory(fuel_type_id,current_stock,threshold,custom_price)")
      .eq("verified", true);
    setStations((st as Station[]) || []);
    const { data: res } = await supabase.from("reservations")
      .select("id,pickup_code,quantity,total_price,refund_amount,status,fuel_type_id,created_at,stations(name),fuel_types(name)")
      .eq("driver_id", profile.id).order("created_at", { ascending: false });
    setReservations((res as unknown as Reservation[]) || []);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  if (!profile) return null;
  const limit = profile.car_classes?.weekly_limit ?? 0;
  const used = profile.weekly_reserved_liters ?? 0;
  const pct = Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));

  function stationStatus(s: Station): "good" | "warn" | "bad" {
    const inv = s.station_fuel_inventory || [];
    if (!inv.some(i => i.current_stock > 0)) return "bad";
    if (inv.some(i => i.current_stock > 0 && i.current_stock <= i.threshold)) return "warn";
    return "good";
  }

  async function requestRefund(id: string) {
    try {
      await api.requestRefund({ reservation_id: id });
      toast("Refund requested");
      await load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Refund request failed");
    }
  }

  return (
    <div className="page-content p-[18px] pb-24">
      <div className="page-intro">
        <div>
          <p className="page-kicker">Driver workspace</p>
          <h1 className="page-title">Ready for the road?</h1>
          <p className="page-description">Check nearby fuel availability and manage your reservations.</p>
        </div>
      </div>
      <Card className="mb-[22px] quota-card">
        <div className="flex justify-between items-baseline mb-2">
          <SectionLabel className="!mb-0">{t("weeklyQuota")} · {profile.car_classes?.name}</SectionLabel>
          <span className="text-2xl font-bold">{limit - used} {t("litresLeft")}</span>
        </div>
        <div className="h-2 rounded-full bg-line overflow-hidden"><div className="h-full bg-amber rounded-full" style={{ width: `${pct}%` }} /></div>
      </Card>

      <SectionLabel className="mt-2">{t("nearbyStations")}</SectionLabel>
      <div className="flex gap-2 mb-3">
        <Button variant={view === "list" ? "primary" : "ghost"} className="!w-auto px-3.5 py-2" onClick={() => setView("list")}>{t("listView")}</Button>
        <Button variant={view === "map" ? "primary" : "ghost"} className="!w-auto px-3.5 py-2" onClick={() => setView("map")}>{t("mapView")}</Button>
      </div>

      {view === "map" ? (
        <SchematicMap stations={stations.map(s => ({ id: s.id, name: s.name, status: stationStatus(s) }))}
          onPick={id => setReserving(stations.find(s => s.id === id) || null)} />
      ) : (
        <div className="station-list">
        {stations.map(s => {
          const status = stationStatus(s);
          return (
            <Card key={s.id} className="mb-3 station-card">
              <div className="flex justify-between gap-2.5">
                <div className="min-w-0 font-bold text-base tracking-tight">{s.name}</div>
                <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${status === "good" ? "bg-good/10 text-good" : status === "warn" ? "bg-warn/10 text-warn" : "bg-bad/10 text-bad"}`}>
                  {status === "good" ? t("fuelAvailable") : status === "warn" ? t("lowStock") : t("outOfStock")}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 my-2.5">
                {(s.station_fuel_inventory || []).map(i => (
                  <span key={i.fuel_type_id} className="text-[11.5px] px-2 py-1 rounded-md bg-cream border border-line text-ink-soft">
                    {fuelTypes[i.fuel_type_id]?.name}
                  </span>
                ))}
              </div>
              <Button disabled={status === "bad"} onClick={() => setReserving(s)}>{t("reserveFuel")}</Button>
            </Card>
          );
        })}
        </div>
      )}

      {reservations.length > 0 && (
        <>
          <SectionLabel className="mt-8">{t("yourReservations")}</SectionLabel>
          {reservations.map(r => (
            <Card key={r.id} className="mb-3">
              <Row label="Station" value={r.stations?.name ?? ""} />
              <Row label="Fuel" value={`${r.fuel_types?.name} · ${r.quantity} L`} />
              <Row label="Pickup code" value={<span className="font-mono">{r.pickup_code}</span>} />
              <Row label="Status" value={<span className="capitalize">{r.status}</span>} />
              {r.status === "expired" && (
                <Button variant="ghost" className="mt-2.5" onClick={() => requestRefund(r.id)}>{t("requestRefund")}</Button>
              )}
            </Card>
          ))}
        </>
      )}

      {reserving && (
        <ReservationSheet station={reserving} fuelTypes={fuelTypes}
          onClose={() => setReserving(null)}
          onDone={async () => { setReserving(null); await load(); await refreshProfile(); }} />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between text-[13.5px] py-1.5 text-ink-soft"><span>{label}</span><b className="text-ink">{value}</b></div>;
}
