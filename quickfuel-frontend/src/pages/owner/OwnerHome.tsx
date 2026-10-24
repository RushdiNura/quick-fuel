import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { SectionLabel, Card } from "../../components/ui/Card";
import { AnalyticsChart } from "./AnalyticsChart";
import type { Station } from "../../types";
import { supabase } from "../../lib/supabase";

export default function OwnerHome() {
  const { profile } = useAuth();
  const [station, setStation] = useState<Station | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data: st } = await supabase.from("stations")
      .select("id,name,station_fuel_inventory(fuel_type_id,current_stock,threshold,fuel_types(name))")
      .eq("owner_id", profile.id).limit(1).single();
    setStation(st as Station | null);
    if (st) {
      const since = new Date(Date.now() - 6 * 86400000).toISOString();
      const { data: res } = await supabase.from("reservations")
        .select("created_at,total_price,status").eq("station_id", st.id).gte("created_at", since);
      setReservations(res || []);
    }
    setLoaded(true);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  if (!loaded) return null;
  if (!station) return <div className="page-content text-center py-16 text-ink-soft"><div className="empty-state"><h3 className="text-ink font-bold mb-1.5">No station yet</h3><p>Ask an admin to register your station.</p></div></div>;

  return (
    <div className="page-content p-[18px] pb-24">
      <div className="page-intro">
        <div>
          <p className="page-kicker">Station owner workspace</p>
          <h1 className="page-title">{station.name}</h1>
          <p className="page-description">A live view of inventory levels, demand, and recent revenue.</p>
        </div>
        <span className="page-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h.01M15 10h.01M9 14h.01M15 14h.01M10 21v-3h4v3"/></svg></span>
      </div>
      <SectionLabel>{station.name} · inventory</SectionLabel>
      <div className="inventory-list">
      {(station.station_fuel_inventory || []).map(i => {
        const pct = Math.min(100, Math.round((i.current_stock / 10000) * 100));
        const low = i.current_stock <= i.threshold;
        return (
          <Card key={i.fuel_type_id} className="mb-3 inventory-card">
            <div className="flex justify-between font-bold text-sm mb-2">
              <span>{i.fuel_types?.name}</span>
              <span className={low ? "text-bad" : "text-ink-soft"}>{Number(i.current_stock).toLocaleString()} L</span>
            </div>
            <div className="h-1.5 rounded bg-line overflow-hidden">
              <div className="h-full rounded" style={{ width: `${pct}%`, background: low ? "#BF4940" : "#268461" }} />
            </div>
            {low && <div className="text-[12px] text-bad font-semibold mt-1.5">Low stock · reorder recommended</div>}
          </Card>
        );
      })}
      </div>

      <SectionLabel className="mt-[22px]">Demand &amp; revenue · last 7 days</SectionLabel>
      <Card><AnalyticsChart reservations={reservations} /></Card>
    </div>
  );
}
