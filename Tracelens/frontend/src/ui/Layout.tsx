import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Activity, Workflow, Bell } from "lucide-react";

export default function Layout() {
  const navigate = useNavigate();
  const user = (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  function handleSignOut() {
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <aside className="bg-panel p-4 border-r border-white/5">
        <h1 className="text-xl font-semibold px-4">AI Observability</h1>
        <nav className="mt-6 flex flex-col gap-1">
          <NavLink to="/" end className={({isActive}) => `sidebar-link ${isActive ? 'active':''}`}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </NavLink>
          <NavLink to="/llm-tracking" className={({isActive}) => `sidebar-link ${isActive ? 'active':''}`}>
            <Activity className="w-4 h-4" /> LLM Tracking
          </NavLink>
          <NavLink to="/agent-workflow" className={({isActive}) => `sidebar-link ${isActive ? 'active':''}`}>
            <Workflow className="w-4 h-4" /> Agent Workflow
          </NavLink>
          <NavLink to="/alerts" className={({isActive}) => `sidebar-link ${isActive ? 'active':''}`}>
            <Bell className="w-4 h-4" /> Alerts
          </NavLink>
          <NavLink to="/profile" className={({isActive}) => `sidebar-link ${isActive ? 'active':''}`}>
            <span className="w-4 h-4 inline-block rounded-full bg-slate-500 mr-2 align-middle" /> Profile
          </NavLink>
        </nav>
        <div className="px-4 mt-8 text-xs text-slate-400">
          <p>{user?.username || 'Guest'}</p>
          <p>{user?.email || 'guest@example.com'}</p>
          <div className="mt-2 flex gap-2">
            {!user && <NavLink to="/login" className="btn btn-sm">Login</NavLink>}
            {user && <button className="btn btn-sm" onClick={handleSignOut}>Sign Out</button>}
          </div>
        </div>
      </aside>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
