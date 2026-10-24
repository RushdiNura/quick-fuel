import { useState } from "react";
import { Card, Field, Select, Input } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../contexts/ToastContext";
import { api, ApiError } from "../../lib/api";

export function RegisterStationForm({
  owners, fuelTypes, onCreated,
}: {
  owners: { id: string; name: string }[];
  fuelTypes: { id: string; name: string }[];
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [license, setLicense] = useState("");
  const [hours, setHours] = useState("");
  const [pumps, setPumps] = useState("4");
  const [ownerId, setOwnerId] = useState(owners[0]?.id ?? "");
  const [stock, setStock] = useState<Record<string, string>>({});
  const toast = useToast();

  async function submit() {
    const latitude = parseFloat(lat), longitude = parseFloat(lng);
    if (!name || isNaN(latitude) || isNaN(longitude)) { toast("Name, latitude and longitude are required"); return; }
    try {
      await api.createStation({
        name, address, latitude, longitude, license, operating_hours: hours,
        pumps: parseInt(pumps) || 1, owner_id: ownerId,
        inventory: fuelTypes
          .map(f => ({ fuel_type_id: f.id, current_stock: parseFloat(stock[f.id]) || 0 }))
          .filter(i => i.current_stock > 0),
      });
      toast("Station registered · pending verification");
      setName(""); setAddress(""); setLat(""); setLng(""); setStock({});
      onCreated();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to register station");
    }
  }

  return (
    <Card>
      <Field label="Name"><Input value={name} onChange={e => setName(e.target.value)} /></Field>
      <Field label="Address"><Input value={address} onChange={e => setAddress(e.target.value)} /></Field>
      <div className="flex gap-2">
        <div className="flex-1"><Field label="Latitude"><Input value={lat} onChange={e => setLat(e.target.value)} /></Field></div>
        <div className="flex-1"><Field label="Longitude"><Input value={lng} onChange={e => setLng(e.target.value)} /></Field></div>
      </div>
      <Field label="License no."><Input value={license} onChange={e => setLicense(e.target.value)} /></Field>
      <Field label="Operating hours"><Input placeholder="6:00 AM – 9:00 PM" value={hours} onChange={e => setHours(e.target.value)} /></Field>
      <Field label="Pumps"><Input type="number" value={pumps} onChange={e => setPumps(e.target.value)} /></Field>
      <Field label="Owner">
        <Select value={ownerId} onChange={e => setOwnerId(e.target.value)}>
          {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </Select>
      </Field>
      <label className="block text-[12.5px] text-ink-soft font-semibold mb-1.5">Initial stock (litres)</label>
      {fuelTypes.map(f => (
        <Field key={f.id} label={f.name}>
          <Input type="number" value={stock[f.id] ?? ""} onChange={e => setStock(s => ({ ...s, [f.id]: e.target.value }))} />
        </Field>
      ))}
      <Button onClick={submit}>Register station</Button>
    </Card>
  );
}
