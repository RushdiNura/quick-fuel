import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../contexts/ToastContext";
import { SectionLabel, Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { CreateUserForm } from "./CreateUserForm";
import { RegisterStationForm } from "./RegisterStationForm";

interface AdminData {
  totalUsers: number; totalStations: number; totalReservations: number;
  pending: { id: string; name: string }[];
  refunds: { id: string; quantity: number; total_price: number; refund_amount: number | null; stations?: { name: string }; fuel_types?: { name: string } }[];
  carClasses: { id: string; name: string }[];
  fuelTypes: { id: string; name: string }[];
  owners: { id: string; name: string }[];
  allStations: { id: string; name: string }[];
  activity: { action: string; created_at: string; profiles?: { name: string } }[];
}

export default function AdminHome() {
  const [data, setData] = useState<AdminData | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    const [{ count: totalUsers }, { count: totalReservations }, { data: stationsList }, { data: refunds },
      { data: carClasses }, { data: fuelTypes }, { data: owners }, { data: activity }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("reservations").select("*", { count: "exact", head: true }),
      supabase.from("stations").select("id,name,verified"),
      supabase.from("reservations").select("id,quantity,total_price,refund_amount,stations(name),fuel_types(name)").eq("status", "pending_refund"),
      supabase.from("car_classes").select("id,name,weekly_limit"),
      supabase.from("fuel_types").select("id,name,base_price"),
      supabase.from("profiles").select("id,name").eq("role", "station_owner"),
      supabase.from("system_activity").select("action,details,created_at,profiles(name)").order("created_at", { ascending: false }).limit(15),
    ]);
    setData({
      totalUsers: totalUsers || 0, totalReservations: totalReservations || 0,
      totalStations: (stationsList || []).length,
      pending: (stationsList || []).filter((s: any) => !s.verified),
      refunds: (refunds as any) || [], carClasses: carClasses || [], fuelTypes: fuelTypes || [],
      owners: owners || [], allStations: stationsList || [], activity: (activity as any) || [],
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function decide(id: string, approve: boolean) {
    try {
      await api.approveRefund({ reservation_id: id, decision: approve ? "approve" : "reject" });
      toast(approve ? "Refund approved" : "Refund rejected");
      await load();
    } catch (e) { toast(e instanceof ApiError ? e.message : "Failed"); }
  }
  async function verifyStation(id: string) {
    const { error } = await supabase.from("stations").update({ verified: true }).eq("id", id);
    if (error) { toast(error.message); return; }
    toast("Station verified");
    await load();
  }

  if (!data) return null;

  return (
    <div className="page-content p-[18px] pb-24 admin-page">
      <div className="page-intro">
        <div>
          <p className="page-kicker">QuickFuel administration</p>
          <h1 className="page-title">Operations overview</h1>
          <p className="page-description">Manage access, review station activity, and keep the network moving.</p>
        </div>
        <span className="page-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.2 2.1 3-.1.9 2.8 2.6 1.5-.8 2.9.8 2.9-2.6 1.5-.9 2.8-3-.1L12 21l-2.2-2.1-3 .1-.9-2.8-2.6-1.5.8-2.9-.8-2.9 2.6-1.5.9-2.8 3 .1L12 3z"/><circle cx="12" cy="12" r="3"/></svg></span>
      </div>
      <div className="admin-stats grid grid-cols-2 gap-2.5 mb-1.5">
        <Stat num={data.totalUsers} label="Total users" />
        <Stat num={data.totalStations} label="Stations" />
        <Stat num={data.totalReservations} label="Reservations" />
        <Stat num={data.pending.length} label="Pending verification" />
      </div>

      <SectionLabel className="mt-1.5">Pending refund approvals</SectionLabel>
      {data.refunds.length === 0 ? (
        <Card className="text-center py-6 text-ink-soft"><p>Nothing pending</p></Card>
      ) : data.refunds.map(r => (
        <Card key={r.id} className="mb-3">
          <Row label="Station" value={r.stations?.name ?? ""} />
          <Row label="Fuel" value={`${r.fuel_types?.name ?? ""} · ${r.quantity} L`} />
          <Row label="Refund amount" value={`ETB ${Number(r.refund_amount ?? r.total_price * 0.92).toFixed(2)}`} />
          <div className="flex gap-2 mt-2.5">
            <Button onClick={() => decide(r.id, true)}>Approve</Button>
            <Button variant="ghost" onClick={() => decide(r.id, false)}>Reject</Button>
          </div>
        </Card>
      ))}

      <SectionLabel className="mt-[22px]">Create user</SectionLabel>
      <CreateUserForm carClasses={data.carClasses} stations={data.allStations} onCreated={load} />

      <SectionLabel className="mt-[22px]">Register station</SectionLabel>
      <RegisterStationForm owners={data.owners} fuelTypes={data.fuelTypes} onCreated={load} />

      {data.pending.length > 0 && (
        <>
          <SectionLabel className="mt-[22px]">Pending station verification</SectionLabel>
          {data.pending.map(s => (
            <Card key={s.id} className="mb-3">
              <Row label="Station" value={s.name} />
              <Button className="mt-2" onClick={() => verifyStation(s.id)}>Verify</Button>
            </Card>
          ))}
        </>
      )}

      <SectionLabel className="mt-[22px]">Recent activity</SectionLabel>
      <Card>
        {data.activity.length === 0 ? <span className="text-ink-soft text-sm">No activity yet</span> : data.activity.map((a, i) => (
          <div key={i} className="flex justify-between items-start text-[13px] text-ink-soft py-1.5">
            <span>{a.profiles?.name ?? "System"} — {a.action.replace(/_/g, " ")}</span>
            <b className="text-[11px] text-ink-soft whitespace-nowrap ml-2">{new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</b>
          </div>
        ))}
      </Card>
    </div>
  );
}

function Stat({ num, label }: { num: number; label: string }) {
  return <Card className="stat-card"><div className="stat-card-number">{num.toLocaleString()}</div><div className="text-[12px] text-ink-soft mt-2 font-semibold">{label}</div></Card>;
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between text-[13.5px] py-1.5 text-ink-soft"><span>{label}</span><b className="text-ink">{value}</b></div>;
}
