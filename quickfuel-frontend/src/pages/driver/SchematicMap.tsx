export interface MapStation { id: string; name: string; status: "good" | "warn" | "bad" }

function hashCode(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

export function SchematicMap({ stations, onPick }: { stations: MapStation[]; onPick: (id: string) => void }) {
  const cx = 140, cy = 140, R = 112;
  const colors = { good: "#268461", warn: "#B97818", bad: "#BF4940" };
  return (
    <div className="surface-card map-card">
      <div className="mb-2 flex items-center justify-between gap-3 px-1 pt-1">
        <div><h3 className="font-bold tracking-tight">Station overview</h3><p className="mt-0.5 text-xs text-ink-soft">Select a station to reserve fuel</p></div>
        <span className="rounded-full bg-cream px-3 py-1.5 text-[11px] font-semibold text-ink-soft">{stations.length} {stations.length === 1 ? "station" : "stations"}</span>
      </div>
      {stations.length === 0 ? (
        <div className="empty-state">No verified stations are available yet.</div>
      ) : (
        <svg viewBox="0 0 280 280" className="mx-auto block w-full max-w-[440px]" role="img" aria-label="Schematic overview of nearby fuel stations">
          {[38, 76, 112].map(r => <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="rgb(var(--color-line))" strokeDasharray="3,5" />)}
          {stations.map((s, i) => {
            const angle = (hashCode(s.name) % 360) * Math.PI / 180;
            const r = Math.min(R, 30 + (i % 5) * 18);
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            return (
              <g key={s.id} role="button" tabIndex={0} aria-label={`Reserve at ${s.name}, ${s.status === "good" ? "fuel available" : s.status === "warn" ? "low stock" : "out of stock"}`} onClick={() => onPick(s.id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(s.id); } }} style={{ cursor: "pointer", outline: "none" }}>
                <circle cx={x} cy={y} r={15} fill={colors[s.status]} opacity=".14" />
                <circle cx={x} cy={y} r={8} fill={colors[s.status]} stroke="rgb(var(--color-paper))" strokeWidth="2" />
                <text x={x} y={y - 14} fontSize="9" fontWeight="600" textAnchor="middle" fill="rgb(var(--color-ink))">{s.name.split(" ")[0].slice(0, 12)}</text>
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r={10} fill="#103F38" stroke="rgb(var(--color-paper))" strokeWidth="3" />
          <circle cx={cx} cy={cy} r={3} fill="#F2AA63" />
          <text x={cx} y={cy + 25} fontSize="10" fontWeight="700" textAnchor="middle" fill="rgb(var(--color-ink-soft))">You</text>
        </svg>
      )}
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[11px] font-semibold text-ink-soft">
        {([ ["good", "Fuel available"], ["warn", "Low stock"], ["bad", "Out of stock"] ] as const).map(([key, label]) => <span key={key} className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: colors[key] }} />{label}</span>)}
      </div>
      <p className="mt-3 text-center text-[10px] text-ink-soft">Schematic layout by relative position · not to map scale</p>
    </div>
  );
}
