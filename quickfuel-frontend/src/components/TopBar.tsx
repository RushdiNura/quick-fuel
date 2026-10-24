import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLang } from "../contexts/LangContext";
import type { Lang } from "../lib/i18n";
import { supabase } from "../lib/supabase";
import { Sheet } from "./ui/Sheet";

export function TopBar() {
  const { profile, notifications, refreshNotifications, signOut } = useAuth();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  async function markAllRead() {
    if (!profile) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", profile.id).eq("read", false);
    await refreshNotifications();
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="brand-lockup" aria-label="QuickFuel home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="w-[23px] h-[23px]">
              <path d="M14 3v18M6 21V9a2 2 0 0 1 2-2h4M6 9h8m5 3v6a2 2 0 0 1-2 2h-1M19 12V7.5L16.5 5" />
            </svg>
          </span>
          <span>
            <span className="brand-name block">QuickFuel</span>
            <span className="brand-tagline">Fuel access, made simpler</span>
          </span>
        </div>

        <div className="header-actions">
          <div className="header-tools" role="group" aria-label="Choose language">
            {(["en", "am", "om"] as Lang[]).map(l => (
              <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l}
                className={`header-tool ${lang === l ? "is-active" : ""}`}>
                {l === "en" ? "EN" : l === "am" ? "አማ" : "OM"}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setOpen(true)} className="notification-button" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px]" aria-hidden="true">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
            {unread > 0 && <span className="notification-count">{unread > 99 ? "99+" : unread}</span>}
          </button>
          <span className="role-chip"><span className="role-dot" />{profile ? t(profile.role) : ""}</span>
          <button type="button" onClick={signOut} className="signout-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
              <path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
            </svg>
            {t("signOut")}
          </button>
        </div>
      </div>

      <Sheet open={open} title="Notifications" onClose={() => setOpen(false)}
        footer={unread > 0 ? <button type="button" onClick={markAllRead} className="app-button app-button-ghost w-full">Mark all as read</button> : undefined}>
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cream text-ink-soft">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-6 w-6"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>
            </div>
            <p className="font-semibold text-ink">You’re all caught up</p>
            <p className="mt-1 text-sm">New updates will appear here.</p>
          </div>
        ) : notifications.map(n => (
          <article key={n.id} className={`mb-3 rounded-2xl border border-line bg-paper p-4 ${n.read ? "opacity-60" : "shadow-sm"}`}>
            <div className="flex items-start gap-3">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-line" : "bg-amber"}`} aria-hidden="true" />
              <div className="min-w-0">
                <h4 className="text-sm font-bold leading-snug">{n.title}</h4>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{n.body}</p>
              </div>
            </div>
          </article>
        ))}
      </Sheet>
    </header>
  );
}
