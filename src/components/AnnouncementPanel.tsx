import React, { useState } from "react";
import { Announcement } from "../types";
import { Button, Card, Modal } from "./Shared";

interface Props {
  announcements: Announcement[];
  isWarden: boolean;
  studentBlock?: string;
  onAdd?: (a: Announcement) => void;
  onRemove?: (id: string) => void;
}

function isActiveNow(a: Announcement): boolean {
  const now = Date.now();
  return a.isActive && new Date(a.startTime).getTime() <= now + 86400000 && new Date(a.endTime).getTime() >= now;
}

export const AnnouncementBanners: React.FC<{ announcements: Announcement[]; studentBlock: string }> = ({
  announcements, studentBlock,
}) => {
  const visible = announcements.filter(a =>
    isActiveNow(a) &&
    (a.affectedBlocks.includes("All") || a.affectedBlocks.includes(studentBlock))
  );
  if (visible.length === 0) return null;

  const colors: Record<string, string> = {
    maintenance: "#fffbeb", event: "#f0fdf4", notice: "#eff6ff", emergency: "#fef2f2",
  };
  const icons: Record<string, string> = {
    maintenance: "🔧", event: "🎉", notice: "📢", emergency: "🚨",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
      {visible.map(a => (
        <div key={a.id} style={{
          background: colors[a.category] || "#fffbeb",
          border: `1.5px solid ${a.category === "emergency" ? "#fca5a5" : "#e2e8f0"}`,
          borderLeft: `4px solid ${a.category === "emergency" ? "#dc2626" : a.category === "maintenance" ? "#f59e0b" : "var(--blue)"}`,
          borderRadius: 8, padding: "10px 14px",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
              {icons[a.category]} {a.title}
            </div>
            <div style={{ fontSize: 13, color: "#374151", marginTop: 3 }}>{a.description}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
              {new Date(a.startTime).toLocaleDateString("en-IN")} — {new Date(a.endTime).toLocaleDateString("en-IN")}
              {" · "}Blocks: {a.affectedBlocks.join(", ")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const AnnouncementPanel: React.FC<Props> = ({ announcements, isWarden, studentBlock, onAdd, onRemove }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", blocks: [] as string[],
    startTime: "", endTime: "", category: "notice" as Announcement["category"],
  });

  const allBlocks = ["A", "B", "C", "D"];

  const toggleBlock = (b: string) => {
    if (b === "All") {
      setForm(f => ({ ...f, blocks: f.blocks.includes("All") ? [] : ["All"] }));
    } else {
      setForm(f => ({
        ...f,
        blocks: f.blocks.includes("All") ? [b] :
          f.blocks.includes(b) ? f.blocks.filter(x => x !== b) : [...f.blocks, b],
      }));
    }
  };

  const handleAdd = () => {
    if (!form.title.trim() || !form.startTime || !form.endTime || form.blocks.length === 0) return;
    const ann: Announcement = {
      id: `ann${Date.now()}`,
      title: form.title, description: form.description,
      affectedBlocks: form.blocks,
      startTime: new Date(form.startTime), endTime: new Date(form.endTime),
      category: form.category, createdBy: "w001",
      createdAt: new Date(), isActive: true,
    };
    onAdd?.(ann);
    setOpen(false);
    setForm({ title: "", description: "", blocks: [], startTime: "", endTime: "", category: "notice" });
  };

  const visible = isWarden ? announcements : announcements.filter(a =>
    a.affectedBlocks.includes("All") || (studentBlock && a.affectedBlocks.includes(studentBlock))
  );

  return (
    <div>
      {isWarden && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <Button onClick={() => setOpen(true)} size="sm">+ Post Announcement</Button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visible.map(a => (
          <Card key={a.id} style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>
                    {a.category === "maintenance" ? "🔧" : a.category === "event" ? "🎉" : a.category === "emergency" ? "🚨" : "📢"}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--blue-dark)" }}>{a.title}</span>
                  <span style={{
                    fontSize: 10, padding: "2px 6px", borderRadius: 4,
                    background: isActiveNow(a) ? "#f0fdf4" : "#f1f5f9",
                    color: isActiveNow(a) ? "#16a34a" : "#94a3b8",
                    border: `1px solid ${isActiveNow(a) ? "#bbf7d0" : "#e2e8f0"}`,
                    fontWeight: 600, textTransform: "uppercase",
                  }}>
                    {isActiveNow(a) ? "Active" : "Scheduled"}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>{a.description}</div>
                <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#94a3b8" }}>
                  <span>📅 {new Date(a.startTime).toLocaleString("en-IN", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  <span>→</span>
                  <span>{new Date(a.endTime).toLocaleString("en-IN", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  <span>· Blocks: {a.affectedBlocks.join(", ")}</span>
                </div>
              </div>
              {isWarden && onRemove && (
                <Button variant="ghost" size="sm" onClick={() => onRemove(a.id)} style={{ color: "#dc2626" }}>✕</Button>
              )}
            </div>
          </Card>
        ))}
        {visible.length === 0 && (
          <div style={{ textAlign: "center", padding: 24, color: "#94a3b8", fontSize: 13 }}>
            No announcements
          </div>
        )}
      </div>

      {isWarden && (
        <Modal open={open} onClose={() => setOpen(false)} title="Post Announcement" width={480}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} placeholder="Announcement title" />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Details..." />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))} style={inputStyle}>
                <option value="notice">📢 Notice</option>
                <option value="maintenance">🔧 Maintenance</option>
                <option value="event">🎉 Event</option>
                <option value="emergency">🚨 Emergency</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Affected Blocks *</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["All", ...allBlocks].map(b => (
                  <button key={b} type="button" onClick={() => toggleBlock(b)}
                    style={{
                      padding: "6px 14px", borderRadius: 6, cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13,
                      background: form.blocks.includes(b) ? "var(--blue)" : "#f1f5f9",
                      color: form.blocks.includes(b) ? "#fff" : "#64748b",
                      border: `1.5px solid ${form.blocks.includes(b) ? "var(--blue)" : "#e2e8f0"}`,
                    }}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Start Time *</label>
                <input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>End Time *</label>
                <input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!form.title.trim() || !form.startTime || !form.endTime || form.blocks.length === 0}>
                Post Announcement
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", border: "1.5px solid #e2e8f0",
  borderRadius: 6, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box", outline: "none",
};
