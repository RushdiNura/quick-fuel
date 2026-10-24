import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLang } from "../contexts/LangContext";
import { useToast } from "../contexts/ToastContext";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Card";

// These are public demo credentials. Use only for a dedicated demo environment
// with non-sensitive sample data, never for a production administrator account.
const DEMO_EMAIL = "admin@gmail.com";
const DEMO_PASSWORD = "123456";

export default function Login() {
  const { signIn } = useAuth();
  const { t } = useLang();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const err = await signIn(email, password);
    setBusy(false);
    if (err) toast(err);
  }

  return (
    <div className="login-page">
      <section className="login-brand-panel" aria-label="About QuickFuel">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.9}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[23px] h-[23px]"
            >
              <path d="M14 3v18M6 21V9a2 2 0 0 1 2-2h4M6 9h8m5 3v6a2 2 0 0 1-2 2h-1M19 12V7.5L16.5 5" />
            </svg>
          </span>
          <span>
            <span className="brand-name block">QuickFuel</span>
            <span className="brand-tagline">Fuel access, made simpler</span>
          </span>
        </div>

        <div className="login-brand-copy">
          <span className="login-eyebrow">A smarter way to refuel</span>
          <h1 className="login-headline">
            Every stop.
            <br />
            <em>More certain.</em>
          </h1>
          <p className="login-description">
            Book fuel, manage station operations, and keep every part of your
            refuelling journey moving smoothly.
          </p>
          <div
            className="mt-8 flex flex-wrap gap-2"
            aria-label="QuickFuel benefits"
          >
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/80">
              Simple reservations
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/80">
              Clear pickup codes
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/80">
              Connected stations
            </span>
          </div>
        </div>

        <p className="login-footnote">
          QUICKFUEL · A BETTER REFUELLING EXPERIENCE
        </p>
      </section>

      <section className="login-form-wrap">
        <div className="login-card">
          <div
            className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-paper text-petrol shadow-sm md:hidden"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M14 3v18M6 21V9a2 2 0 0 1 2-2h4M6 9h8m5 3v6a2 2 0 0 1-2 2h-1M19 12V7.5L16.5 5" />
            </svg>
          </div>
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[.13em] text-amber-dark">
            Welcome back
          </p>
          <h2 className="login-card-title">Sign in to QuickFuel</h2>
          <p className="login-card-subtitle">
            Sign in with your account to continue to QuickFuel.
          </p>

          <form onSubmit={submit}>
            <Field label={t("email")}>
              <Input
                type="email"
                autoComplete="username"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label={t("password")}>
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            <Button type="submit" disabled={busy} className="mt-1">
              {busy ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                  />
                  Signing in…
                </>
              ) : (
                <>
                  {t("signIn")}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </Button>
          </form>

          <aside
            className="login-demo-hint"
            aria-label="Administrator demo credentials"
          >
            <span className="login-demo-hint-mark" aria-hidden="true">
              i
            </span>
            <div className="login-demo-hint-content">
              <p className="login-demo-hint-title">Admin demo access</p>
              <p className="login-demo-hint-copy">
                To explore the project as an administrator, use{" "}
                <code>{DEMO_EMAIL}</code> with password{" "}
                <code>{DEMO_PASSWORD}</code>.
              </p>
              <p className="login-demo-hint-footnote">
                Demo account · Please use sample data only.
              </p>
            </div>
          </aside>

          <div className="login-secure-note">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 shrink-0"
              aria-hidden="true"
            >
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            Access is managed securely by your administrator.
          </div>
        </div>
      </section>
    </div>
  );
}
