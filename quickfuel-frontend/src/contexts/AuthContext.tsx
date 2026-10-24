import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Profile, Notification } from "../types";

interface AuthCtx {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  notifications: Notification[];
  signIn: (email: string, password: string) => Promise<string | null>; // returns error message, if any
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  async function loadProfile(userId: string) {
    const { data } = await supabase.from("profiles")
      .select("*, car_classes(id,name,weekly_limit)").eq("id", userId).single();
    setProfile(data as Profile | null);
  }

  async function refreshNotifications() {
    if (!session) return;
    const { data } = await supabase.from("notifications")
      .select("id,title,body,read,created_at").eq("user_id", session.user.id)
      .order("created_at", { ascending: false }).limit(20);
    setNotifications((data as Notification[]) || []);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadProfile(data.session.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) loadProfile(s.user.id); else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) refreshNotifications(); }, [session, profile?.role]);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }
  async function signOut() {
    await supabase.auth.signOut();
  }
  async function refreshProfile() {
    if (session) await loadProfile(session.user.id);
  }

  return (
    <Ctx.Provider value={{ session, profile, loading, notifications, signIn, signOut, refreshProfile, refreshNotifications }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
