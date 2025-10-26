import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Activity, Workflow, Bell } from "lucide-react";

export default function Layout() {
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
        </nav>
        <div className="px-4 mt-8 text-xs text-slate-400">
          <p>ayushsurana</p>
          <p>ayushsurana3@gmail.com</p>
        </div>
      </aside>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
