import React from "react";
import { Priority, Status, Category } from "../types";

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; icon: string }> = {
  urgent: { label: "URGENT", color: "#dc2626", bg: "#fef2f2", icon: "🚨" },
  high: { label: "HIGH", color: "#d97706", bg: "#fffbeb", icon: "⚠️" },
  medium: { label: "MEDIUM", color: "#2563eb", bg: "#eff6ff", icon: "📋" },
  low: { label: "LOW", color: "#16a34a", bg: "#f0fdf4", icon: "📌" },
};

export const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string }> = {
  open: { label: "Open", color: "#dc2626", bg: "#fef2f2" },
  acknowledged: { label: "Acknowledged", color: "#d97706", bg: "#fffbeb" },
  in_progress: { label: "In Progress", color: "#2563eb", bg: "#eff6ff" },
  pending_confirmation: { label: "Pending Confirmation", color: "#7c3aed", bg: "#f5f3ff" },
  resolved: { label: "Resolved", color: "#16a34a", bg: "#f0fdf4" },
  reopened: { label: "Reopened", color: "#dc2626", bg: "#fff1f2" },
};

export const CATEGORY_CONFIG: Record<Category, { label: string; icon: string }> = {
  maintenance: { label: "Maintenance", icon: "🔧" },
  mess: { label: "Mess / Food", icon: "🍽️" },
  room: { label: "Room", icon: "🛏️" },
  wifi: { label: "WiFi / Internet", icon: "📶" },
  personal: { label: "Personal", icon: "🔒" },
  health: { label: "Health", icon: "🏥" },
  other: { label: "Other", icon: "📝" },
};

interface BadgeProps {
  priority?: Priority;
  status?: Status;
  category?: Category;
}

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}40`,
      padding: "2px 8px", borderRadius: 4,
      fontSize: 11, fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: "0.05em",
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}40`,
      padding: "2px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600,
    }}>
      {cfg.label}
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: Category }> = ({ category }) => {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <span style={{
      background: "var(--cream-dark)", color: "var(--blue)",
      border: "1px solid var(--blue)20",
      padding: "2px 8px", borderRadius: 4,
      fontSize: 11, fontWeight: 600,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

export const SLATimer: React.FC<{ hoursLeft: number; breached: boolean; deadlineHours: number }> = ({
  hoursLeft, breached, deadlineHours,
}) => {
  const pct = breached ? 100 : Math.max(0, 100 - (hoursLeft / deadlineHours) * 100);
  const color = breached ? "#dc2626" : pct > 75 ? "#d97706" : pct > 50 ? "#2563eb" : "#16a34a";

  const fmt = (h: number) => {
    if (h < 1) return `${Math.floor(h * 60)}m`;
    if (h < 24) return `${Math.floor(h)}h ${Math.floor((h % 1) * 60)}m`;
    return `${Math.floor(h / 24)}d ${Math.floor(h % 24)}h`;
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 80, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%", background: color,
          borderRadius: 3, transition: "width 1s ease",
        }} />
      </div>
      <span style={{
        fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
        color: breached ? "#dc2626" : "#64748b", fontWeight: breached ? 700 : 400,
      }}>
        {breached ? "BREACHED" : fmt(hoursLeft)}
      </span>
    </div>
  );
};

export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "gold";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit";
  style?: React.CSSProperties;
}> = ({ children, onClick, variant = "primary", size = "md", disabled, fullWidth, type = "button", style }) => {
  const sizes = { sm: "6px 14px", md: "9px 20px", lg: "12px 28px" };
  const fontSize = { sm: 12, md: 14, lg: 16 };
  const variants = {
    primary: { bg: "var(--blue)", color: "#fff", border: "var(--blue)", hoverBg: "var(--blue-mid)" },
    secondary: { bg: "transparent", color: "var(--blue)", border: "var(--blue)", hoverBg: "var(--cream-dark)" },
    danger: { bg: "#dc2626", color: "#fff", border: "#dc2626", hoverBg: "#b91c1c" },
    ghost: { bg: "transparent", color: "#64748b", border: "transparent", hoverBg: "#f1f5f9" },
    gold: { bg: "var(--gold)", color: "var(--blue-dark)", border: "var(--gold)", hoverBg: "var(--gold-light)" },
  };
  const v = variants[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: sizes[size], fontSize: fontSize[size],
        background: disabled ? "#e2e8f0" : v.bg,
        color: disabled ? "#94a3b8" : v.color,
        border: `1.5px solid ${disabled ? "#e2e8f0" : v.border}`,
        borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
        width: fullWidth ? "100%" : undefined,
        transition: "all 0.15s", whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; className?: string }> = ({
  children, style, className,
}) => (
  <div className={className} style={{
    background: "#fff", borderRadius: 10,
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 4px rgba(26,58,110,0.06)",
    padding: 20, ...style,
  }}>
    {children}
  </div>
);

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}> = ({ open, onClose, title, children, width = 560 }) => {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(6,16,31,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "#fff", borderRadius: 12, width, maxWidth: "100%",
        maxHeight: "90vh", overflow: "auto",
        boxShadow: "0 20px 60px rgba(6,16,31,0.3)",
      }}>
        <div style={{
          padding: "16px 24px", borderBottom: "1px solid #e2e8f0",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, background: "#fff", zIndex: 1,
        }}>
          <h3 style={{ margin: 0, fontSize: 17, color: "var(--blue-dark)", fontFamily: "'Tiro Devanagari Hindi', serif" }}>
            {title}
          </h3>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 20, cursor: "pointer",
            color: "#94a3b8", lineHeight: 1, padding: "0 4px",
          }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

export const StarRating: React.FC<{
  value?: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}> = ({ value, onChange, readonly }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {[1, 2, 3, 4, 5].map(n => (
      <button key={n} type="button"
        onClick={() => !readonly && onChange?.(n)}
        style={{
          background: "none", border: "none", fontSize: 24, cursor: readonly ? "default" : "pointer",
          color: n <= (value ?? 0) ? "#f59e0b" : "#cbd5e1", padding: 0,
          transition: "transform 0.1s",
        }}
      >★</button>
    ))}
  </div>
);

export const EmptyState: React.FC<{ icon: string; message: string; sub?: string }> = ({ icon, message, sub }) => (
  <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
    <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 16, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>{message}</div>
    {sub && <div style={{ fontSize: 13 }}>{sub}</div>}
  </div>
);
