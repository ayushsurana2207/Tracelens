import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    const username = email.split("@")[0] || "guest";
    localStorage.setItem(
      "user",
      JSON.stringify({ username, email })
    );
    navigate("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-panel border border-white/10 rounded-xl p-6 shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">AI Observability</h1>
          <p className="text-slate-400 mt-1">Monitor your AI systems in real-time</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button className="btn btn-primary flex-1">Login</button>
          <Link to="/register" className="btn flex-1 text-center">Register</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-300">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="btn btn-primary w-full">Sign In</button>
        </form>
      </div>
    </div>
  );
}


