import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type User = { username: string; email: string } | null;

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) setUser(JSON.parse(raw));
  }, []);

  function handleSignOut() {
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-panel border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-1">Profile</h2>
        <p className="text-slate-400 mb-6">Manage your account details</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-300">Username</label>
            <input
              className="input"
              value={user?.username || "Guest"}
              readOnly
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">Email</label>
            <input className="input" value={user?.email || "guest@example.com"} readOnly />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button className="btn" onClick={() => navigate("/")}>Back to Dashboard</button>
          <button className="btn btn-primary" onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}


