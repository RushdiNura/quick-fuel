import { useState } from "react";
import { useLang } from "../../contexts/LangContext";
import { useToast } from "../../contexts/ToastContext";
import { api, ApiError } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { SectionLabel, Card } from "../../components/ui/Card";

export default function OperatorHome() {
  const { t } = useLang();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [reservation, setReservation] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function verify() {
    setError(null); setReservation(null); setBusy(true);
    try {
      const { reservation } = await api.verifyCode({ code: code.trim() });
      setReservation(reservation);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong");
    } finally { setBusy(false); }
  }

  async function authorise() {
    if (!reservation) return;
    try {
      await api.dispenseAuthorise({ reservation_id: reservation.id });
      toast("Dispensing authorised");
      await verify();
    } catch (e) { toast(e instanceof ApiError ? e.message : "Failed to authorise"); }
  }
  async function complete() {
    if (!reservation) return;
    try {
      await api.dispenseComplete({ reservation_id: reservation.id });
      toast("Dispensing complete · stock updated");
      setReservation(null); setCode("");
    } catch (e) { toast(e instanceof ApiError ? e.message : "Failed to complete"); }
  }

  return (
    <div className="page-content p-[18px] pb-24">
      <div className="page-intro">
        <div>
          <p className="page-kicker">Station workspace</p>
          <h1 className="page-title">Pickup verification</h1>
          <p className="page-description">Confirm a driver’s reservation before authorising fuel dispensing.</p>
        </div>
        <span className="page-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5M8 17h3"/></svg></span>
      </div>
      <SectionLabel>{t("verifyPickup")}</SectionLabel>
      <div className="verify-code-row flex gap-2 mb-3.5">
        <input aria-label="Pickup code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} maxLength={6} placeholder="000000"
          className="form-control flex-1 !py-3 !text-[22px] !tracking-[0.18em] text-center font-mono" />
        <Button className="!w-auto px-4" onClick={verify} disabled={busy || code.length < 4}>{t("verify")}</Button>
      </div>

      {error && (
        <div className="surface-card text-center mt-5 border-bad/30 py-8 text-ink-soft"><div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-bad/10 text-bad text-xl" aria-hidden="true">!</div><h3 className="text-ink font-bold mb-1.5">No match</h3><p>{error}</p></div>
      )}

      {reservation && (
        <Card>
          <Row label="Fuel" value={`${reservation.fuel_types?.name ?? ""} · ${reservation.quantity} L`} />
          <Row label="Status" value={<span className="capitalize">{reservation.status}</span>} />
          <div className="flex gap-2 mt-3.5">
            <Button variant={reservation.status === "confirmed" ? "primary" : "ghost"} disabled={reservation.status !== "confirmed"} onClick={authorise}>
              {t("authorise")}
            </Button>
            <Button variant={reservation.status === "dispensing" ? "primary" : "ghost"} disabled={reservation.status !== "dispensing"} onClick={complete}>
              {t("complete")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between text-[13.5px] py-1.5 text-ink-soft"><span>{label}</span><b className="text-ink">{value}</b></div>;
}
