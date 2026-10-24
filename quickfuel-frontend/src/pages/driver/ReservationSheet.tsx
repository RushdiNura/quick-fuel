import { useState } from "react";
import { Sheet } from "../../components/ui/Sheet";
import { Button } from "../../components/ui/Button";
import { Field, Select } from "../../components/ui/Card";
import { api } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../contexts/ToastContext";
import type { Station, FuelType } from "../../types";

const SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "4:00 PM"];

export function ReservationSheet({
  station, fuelTypes, onClose, onDone,
}: {
  station: Station; fuelTypes: Record<string, FuelType>; onClose: () => void; onDone: () => void;
}) {
  const [step, setStep] = useState(1);
  const [slotLabel, setSlotLabel] = useState<string | null>(null);
  const [fuelId, setFuelId] = useState(station.station_fuel_inventory?.[0]?.fuel_type_id ?? "");
  const [qty, setQty] = useState(10);
  const [provider, setProvider] = useState<"telebirr" | "chapa">("telebirr");
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const inv = station.station_fuel_inventory?.find(i => i.fuel_type_id === fuelId);
  const price = (inv?.custom_price ?? fuelTypes[fuelId]?.base_price ?? 0) * qty;

  async function pay() {
    setBusy(true);
    try {
      const { data: slot } = await supabase.from("time_slots")
        .select("id").eq("station_id", station.id).eq("status", "open").limit(1).single();
      if (!slot) throw new Error("No open time slots at this station right now.");
      const r = await api.reserve({ station_id: station.id, fuel_type_id: fuelId, slot_id: slot.id, quantity: qty });
      const paid = await api.mockPayment({ reservation_id: r.reservationId, provider });
      setCode(paid.pickupCode);
      setStep(4);
    } catch (e: any) {
      toast(e.message || "Reservation failed");
    } finally { setBusy(false); }
  }

  return (
    <Sheet open title={step === 4 ? "Confirmed" : "Reserve fuel"} onClose={step === 4 ? onDone : onClose} steps={step}
      footer={
        step === 1 ? <Button disabled={!slotLabel} onClick={() => setStep(2)}>Continue</Button>
        : step === 2 ? <Button onClick={() => setStep(3)}>Continue</Button>
        : step === 3 ? <Button disabled={busy} onClick={pay}>{busy ? "…" : `Pay ETB ${price.toFixed(2)}`}</Button>
        : <Button variant="ghost" onClick={onDone}>Done</Button>
      }>
      {step === 1 && (
        <>
          <p className="text-[12.5px] text-ink-soft font-semibold mb-2.5">{station.name} · pick a time slot</p>
          <div className="grid grid-cols-2 gap-2">
            {SLOTS.map(s => (
              <button key={s} type="button" onClick={() => setSlotLabel(s)} aria-pressed={slotLabel === s}
                className="choice-card justify-center text-center text-[13px] font-semibold">
                <span>{s}</span>{slotLabel === s && <span className="text-amber-dark" aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <Field label="Fuel type">
            <Select value={fuelId} onChange={e => setFuelId(e.target.value)}>
              {station.station_fuel_inventory?.map(i => (
                <option key={i.fuel_type_id} value={i.fuel_type_id}>{fuelTypes[i.fuel_type_id]?.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Quantity (litres, 5–200)">
            <div className="flex items-center gap-3">
              <button type="button" aria-label="Decrease quantity by 5 litres" onClick={() => setQty(q => Math.max(5, q - 5))} className="w-10 h-10 rounded-xl bg-cream border border-line text-lg font-bold transition hover:border-amber">−</button>
              <div className="flex-1 text-center text-xl font-bold">{qty} L</div>
              <button type="button" aria-label="Increase quantity by 5 litres" onClick={() => setQty(q => Math.min(200, q + 5))} className="w-10 h-10 rounded-xl bg-cream border border-line text-lg font-bold transition hover:border-amber">+</button>
            </div>
          </Field>
          <div className="flex justify-between pt-2.5 mt-1.5 border-t border-dashed border-line font-bold">
            <span>Total</span><span>ETB {price.toFixed(2)}</span>
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <p className="text-[12.5px] text-ink-soft font-semibold mb-2.5">Total: ETB {price.toFixed(2)}</p>
          {(["telebirr", "chapa"] as const).map(p => (
            <button key={p} type="button" aria-pressed={provider === p} onClick={() => setProvider(p)} className="choice-card mb-2.5">
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream text-petrol font-bold uppercase">{p === "telebirr" ? "T" : "C"}</span>
                <span><span className="block font-bold capitalize">{p}</span><span className="mt-0.5 block text-[11px] text-ink-soft">Secure payment option</span></span>
              </span>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${provider === p ? "border-amber bg-amber text-ink" : "border-line"}`} aria-hidden="true">{provider === p ? "✓" : ""}</span>
            </button>
          ))}
        </>
      )}
      {step === 4 && (
        <div className="text-center py-2">
          <div className="w-[52px] h-[52px] rounded-full bg-good/10 text-good flex items-center justify-center mx-auto mb-3 text-2xl">✓</div>
          <h3 className="font-bold text-lg">Reservation confirmed</h3>
          <p className="text-ink-soft text-[13.5px] mt-1">Show this code at {station.name}</p>
          <div className="reservation-code font-mono text-[34px] font-bold my-4">{code}</div>
        </div>
      )}
    </Sheet>
  );
}
