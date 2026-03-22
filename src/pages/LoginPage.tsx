import React, { useState } from "react";
import { STUDENTS, WARDEN } from "../lib/data";
import { User } from "../types";

interface Props {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<Props> = ({ onLogin }) => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = () => {
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (id === WARDEN.id && password === WARDEN.password) {
        onLogin({ id: WARDEN.id, role: "warden", name: `Dr. Ramesh Patnaik` });
        return;
      }
      const student = STUDENTS.find(s => s.id === id && s.password === password);
      if (student) {
        onLogin({ id: student.id, role: "student", name: student.name });
        return;
      }
      setError("Invalid credentials. Please check your ID and password.");
    }, 600);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--blue-deep)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden",
    }}>
      {/* Background pattern */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: `repeating-linear-gradient(
          45deg,
          var(--gold) 0px, var(--gold) 1px,
          transparent 1px, transparent 60px
        )`,
      }} />
      {/* Glow */}
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, var(--blue-mid)40 0%, transparent 70%)",
        top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", width: 420, padding: 20 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ marginBottom: 16 }}>
            <img src="/logo.png" alt="Campus Whisper Logo" style={{
              width: 88, height: 88, borderRadius: 20,
              boxShadow: "0 8px 24px rgba(201,168,76,0.4)",
              objectFit: "cover",
            }} />
          </div>
          <h1 style={{
            margin: 0, fontSize: 32, fontFamily: "'Tiro Devanagari Hindi', serif",
            color: "#fff", letterSpacing: "-0.02em",
          }}>
            Campus Whisper
          </h1>
          <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            ITER, SOA University · Hostel Grievance System
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16, padding: 32, backdropFilter: "blur(12px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}>
          <h2 style={{ margin: "0 0 24px", fontSize: 18, color: "#fff", fontWeight: 600 }}>
            Sign in to your portal
          </h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              User ID
            </label>
            <input
              value={id}
              onChange={e => setId(e.target.value.trim().toLowerCase())}
              placeholder="Enter your user ID"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{
                width: "100%", padding: "11px 14px",
                background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.15)",
                borderRadius: 8, color: "#fff", fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                boxSizing: "border-box", outline: "none", letterSpacing: "0.05em",
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={{
                  width: "100%", padding: "11px 42px 11px 14px",
                  background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.15)",
                  borderRadius: 8, color: "#fff", fontSize: 14,
                  fontFamily: "'JetBrains Mono', monospace",
                  boxSizing: "border-box", outline: "none",
                }}
              />
              <button onClick={() => setShowPass(!showPass)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 16,
              }}>{showPass ? "🙈" : "👁️"}</button>
            </div>
          </div>

          {error && (
            <div style={{
              background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.4)",
              borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "#fca5a5", marginBottom: 16,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !id || !password}
            style={{
              width: "100%", padding: "12px",
              background: (!id || !password) ? "rgba(201,168,76,0.3)" : "linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%)",
              color: (!id || !password) ? "rgba(255,255,255,0.4)" : "var(--blue-dark)",
              border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700,
              cursor: (!id || !password || loading) ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
              boxShadow: (!id || !password) ? "none" : "0 4px 16px rgba(201,168,76,0.4)",
            }}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>

        </div>
      </div>
    </div>
  );
};
