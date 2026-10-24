import { useState } from "react";
import { Card, Field, Select, Input } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../contexts/ToastContext";
import { api, ApiError } from "../../lib/api";

interface NewCredential {
  name: string;
  email: string;
  role: string;
  tempPassword: string | null;
}

export function CreateUserForm({
  carClasses,
  stations,
  onCreated,
}: {
  carClasses: { id: string; name: string }[];
  stations: { id: string; name: string }[];
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("driver");
  const [carClassId, setCarClassId] = useState(carClasses[0]?.id ?? "");
  const [stationId, setStationId] = useState("");
  const [created, setCreated] = useState<NewCredential | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  async function submit() {
    if (!name.trim() || !email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await api.createUser({
        name: name.trim(),
        email: email.trim(),
        role,
        car_class_id: role === "driver" ? carClassId : undefined,
        assigned_station_id:
          role === "operator" && stationId ? stationId : undefined,
      });

      setCreated({
        name: name.trim(),
        email: email.trim(),
        role,
        tempPassword: extractTemporaryPassword(response),
      });
      setName("");
      setEmail("");
      onCreated();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (created) {
    return (
      <CredentialReveal credential={created} onDone={() => setCreated(null)} />
    );
  }

  return (
    <Card>
      <Field label="Name">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </Field>
      <Field label="Email">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </Field>
      <Field label="Role">
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="driver">Driver</option>
          <option value="station_owner">Station Owner</option>
          <option value="operator">Operator</option>
        </Select>
      </Field>
      <Field label="Car class (drivers only)">
        <Select
          value={carClassId}
          onChange={(e) => setCarClassId(e.target.value)}
        >
          {carClasses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Assign to station (operators only)">
        <Select
          value={stationId}
          onChange={(e) => setStationId(e.target.value)}
        >
          <option value="">—</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
      <Button
        onClick={submit}
        disabled={!name.trim() || !email.trim() || isSubmitting}
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </Card>
  );
}

/** Accept common API naming conventions and nested response payloads. */
function extractTemporaryPassword(response: unknown): string | null {
  const passwordKeys = [
    "tempPassword",
    "temp_password",
    "temporaryPassword",
    "temporary_password",
    "generatedPassword",
    "generated_password",
    "password",
  ];
  const nestedKeys = ["data", "credentials", "user", "result"];
  const queue: unknown[] = [response];
  const visited = new Set<object>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || visited.has(current))
      continue;
    visited.add(current);

    const record = current as Record<string, unknown>;
    for (const key of passwordKeys) {
      const candidate = record[key];
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate;
      }
    }

    for (const key of nestedKeys) {
      const nested = record[key];
      if (nested && typeof nested === "object") queue.push(nested);
    }
  }

  return null;
}

function CredentialReveal({
  credential,
  onDone,
}: {
  credential: NewCredential;
  onDone: () => void;
}) {
  // Show the generated password immediately so the admin does not miss it.
  const [visible, setVisible] = useState(true);
  const toast = useToast();
  const hasPassword = Boolean(credential.tempPassword);

  async function copyPassword() {
    if (!credential.tempPassword) return;
    try {
      await navigator.clipboard.writeText(credential.tempPassword);
      toast("Temporary password copied");
    } catch {
      toast("Couldn't copy — select the password manually");
    }
  }

  async function copyCredentials() {
    if (!credential.tempPassword) return;
    try {
      await navigator.clipboard.writeText(
        `QuickFuel sign-in details\nEmail: ${credential.email}\nTemporary password: ${credential.tempPassword}`,
      );
      toast("Sign-in details copied");
    } catch {
      toast("Couldn't copy details — select them manually");
    }
  }

  return (
    <Card className="overflow-hidden">
      <div
        className="mb-5 flex items-start gap-3 border-b border-line pb-5"
        role="status"
        aria-live="polite"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-good/10 text-good">
          <CheckIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-good">
            Account created successfully
          </p>
          <h2 className="text-lg font-bold leading-tight tracking-tight text-ink">
            Sign-in details are ready
          </h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
            Created for{" "}
            <strong className="font-semibold text-ink">
              {credential.name}
            </strong>
            <span aria-hidden="true"> · </span>
            {formatRole(credential.role)}
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-line bg-cream/70 p-3.5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-ink-soft">
            Login information
          </p>
          <span className="status-pill bg-warn/10 text-warn">
            Temporary access
          </span>
        </div>

        <Field label="Email address">
          <div className="flex min-h-[45px] items-center rounded-[11px] border border-line bg-paper px-3 py-2.5 text-[13.5px] text-ink break-all">
            {credential.email}
          </div>
        </Field>

        <Field label="Temporary password">
          {hasPassword ? (
            <div className="flex flex-wrap items-stretch gap-2">
              <div
                className="flex min-h-[46px] min-w-[140px] flex-1 items-center rounded-[11px] border border-good/30 bg-paper px-3 py-2.5 font-mono text-[13.5px] tracking-wide text-ink shadow-[inset_0_0_0_1px_rgba(38,132,97,0.04)]"
                aria-live="polite"
              >
                <span className="select-all break-all">
                  {visible
                    ? credential.tempPassword
                    : "•".repeat(credential.tempPassword!.length)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={
                  visible
                    ? "Hide temporary password"
                    : "Show temporary password"
                }
                title={visible ? "Hide password" : "Show password"}
                className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-[11px] border border-line bg-paper px-3 text-[12px] font-bold text-ink-soft transition-colors hover:border-amber-dark/50 hover:bg-cream hover:text-ink"
              >
                {visible ? <EyeOffIcon /> : <EyeIcon />}
                <span>{visible ? "Hide" : "Show"}</span>
              </button>
              <button
                type="button"
                onClick={copyPassword}
                aria-label="Copy temporary password"
                title="Copy password"
                className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-[11px] border border-line bg-paper px-3 text-[12px] font-bold text-ink-soft transition-colors hover:border-amber-dark/50 hover:bg-cream hover:text-ink"
              >
                <CopyIcon />
                <span>Copy</span>
              </button>
            </div>
          ) : (
            <div
              className="rounded-xl border border-warn/30 bg-warn/10 p-3 text-[12.5px] leading-relaxed text-ink"
              role="alert"
            >
              <strong className="font-bold">
                The account was created, but no password was returned.
              </strong>
              <span className="mt-1 block text-ink-soft">
                Check the create-user API response to ensure it returns the
                generated temporary password. The interface cannot safely invent
                or recover a password that the server did not send.
              </span>
            </div>
          )}
        </Field>
      </div>

      <p className="mb-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-ink-soft">
        <LockIcon />
        <span>
          Copy these details and share them securely with the user. Keep the
          temporary password private.
        </span>
      </p>

      <div className="space-y-2.5">
        <Button onClick={copyCredentials} disabled={!hasPassword}>
          <CopyIcon />
          Copy sign-in details
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Done — I've saved them
        </Button>
      </div>
    </Card>
  );
}

function formatRole(role: string) {
  return role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-[17px] w-[17px]"
      aria-hidden="true"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-[17px] w-[17px]"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-7-11-7a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 7 11 7a20.3 20.3 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[16px] w-[16px]"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
