import { cloneElement, isValidElement, useId, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode, type ReactElement } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`surface-card ${className}`}>{children}</div>;
}

export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`section-label ${className}`}>{children}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  const fieldId = useId();
  const isControl = isValidElement(children) && (children.type === Input || children.type === Select);
  const control = isControl ? cloneElement(children as ReactElement<any>, { id: fieldId }) : children;
  return (
    <div className="field-group">
      <label className="field-label" htmlFor={isControl ? fieldId : undefined}>{label}</label>
      {control}
    </div>
  );
}

const fieldClass = "form-control";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

export function Badge({ status, children }: { status: "good" | "warn" | "bad"; children: ReactNode }) {
  const map = {
    good: ["bg-good/10", "text-good"],
    warn: ["bg-warn/10", "text-warn"],
    bad: ["bg-bad/10", "text-bad"],
  } as const;
  const [bg, fg] = map[status];
  return <span className={`status-pill ${bg} ${fg}`}>{children}</span>;
}
