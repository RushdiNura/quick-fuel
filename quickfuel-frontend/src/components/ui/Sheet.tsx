import type { ReactNode } from "react";

export function Sheet({
  open, title, onClose, steps, children, footer,
}: {
  open: boolean; title: string; onClose: () => void;
  steps?: number;
  children: ReactNode; footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <button type="button" className="sheet-overlay" onClick={onClose} aria-label="Close dialog" />
      <section className="sheet-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-header">
          <div className="min-w-0">
            <h3 className="sheet-title">{title}</h3>
            {steps != null && <p className="mt-1 text-xs text-ink-soft">Step {Math.min(steps, 4)} of 4</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="sheet-close">&times;</button>
        </div>
        {steps != null && (
          <div className="flex gap-1.5 px-[22px] pt-4" aria-label={`Step ${Math.min(steps, 4)} of 4`}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= steps ? "bg-amber" : "bg-line"}`} />
            ))}
          </div>
        )}
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer">{footer}</div>}
      </section>
    </>
  );
}
