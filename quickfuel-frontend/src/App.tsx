import { useAuth } from "./contexts/AuthContext";
import { TopBar } from "./components/TopBar";
import Login from "./pages/Login";
import DriverHome from "./pages/driver/DriverHome";
import OperatorHome from "./pages/operator/OperatorHome";
import OwnerHome from "./pages/owner/OwnerHome";
import AdminHome from "./pages/admin/AdminHome";

export default function App() {
  const { session, profile, loading } = useAuth();

  if (loading) return (
    <div className="loading-screen">
      <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M14 3v18M6 21V9a2 2 0 0 1 2-2h4M6 9h8m5 3v6a2 2 0 0 1-2 2h-1M19 12V7.5L16.5 5" /></svg></span>
      <span className="mt-4 font-bold tracking-tight">QuickFuel</span>
      <span className="mt-1 text-sm text-ink-soft">Preparing your workspace…</span>
      <span className="mt-5 h-1 w-24 overflow-hidden rounded-full bg-line"><span className="block h-full w-1/2 animate-pulse rounded-full bg-amber" /></span>
    </div>
  );
  if (!session || !profile) return <div className="app-shell"><Login /></div>;

  return (
    <div className="app-shell">
      <TopBar />
      {profile.role === "driver" && <DriverHome />}
      {profile.role === "operator" && <OperatorHome />}
      {profile.role === "station_owner" && <OwnerHome />}
      {profile.role === "admin" && <AdminHome />}
    </div>
  );
}
