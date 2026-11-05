"use client";

import { useState } from "react";
import { BUSINESS } from "../../lib/calc";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.href = "/";
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not log in.");
    } catch {
      setError("Could not reach the server. Check your connection.");
    }
    setBusy(false);
  };

  return (
    <main className="login-wrap">
      <form className="login card" onSubmit={submit}>
        <p className="eyebrow">Private</p>
        <h1>{BUSINESS}</h1>
        <p className="muted">Profit sharing calculator. Enter the password to continue.</p>
        <label>
          <span>Password</span>
          <input
            type="password" autoFocus autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="warn">{error}</p>}
        <button className="primary" disabled={busy || !password}>
          {busy ? "Checking…" : "Log in"}
        </button>
      </form>
    </main>
  );
}
