import React, { useState } from "react";
import { Complaint } from "../types";
import { PriorityBadge, StatusBadge } from "./Shared";

interface Props {
  complaints: Complaint[];
  block?: string;
}

export const RoomHistory: React.FC<Props> = ({ complaints, block }) => {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [searchRoom, setSearchRoom] = useState("");

  const roomMap = new Map<string, Complaint[]>();
  for (const c of complaints) {
    if (block && c.block !== block) continue;
    if (!roomMap.has(c.room)) roomMap.set(c.room, []);
    roomMap.get(c.room)!.push(c);
  }

  const rooms = [...roomMap.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .filter(([room]) => !searchRoom || room.toLowerCase().includes(searchRoom.toLowerCase()));

  const isRepeat = (rc: Complaint[]) => {
    if (rc.length >= 3) return true;
    const freq = new Map<string, number>();
    for (const c of rc) freq.set(c.category, (freq.get(c.category) || 0) + 1);
    return [...freq.values()].some(v => v >= 2);
  };

  const selected = selectedRoom ? roomMap.get(selectedRoom) || [] : [];

  // Fills the remaining viewport below the warden portal header + kpi + topbar + padding
  const panelH = "calc(100vh - 262px)";

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: selectedRoom ? "300px 1fr" : "380px",
      gap: 16,
      alignItems: "start",
    }}>

      {/* ── Room list ── */}
      <div style={{
        background: "#fff", borderRadius: 12,
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        display: "flex", flexDirection: "column",
        height: panelH, overflow: "hidden",
      }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--blue-dark)", marginBottom: 10 }}>
            🏠 Rooms ({rooms.length})
          </div>
          <input
            placeholder="Search room number…"
            value={searchRoom}
            onChange={e => setSearchRoom(e.target.value)}
            style={{
              width: "100%", padding: "8px 12px",
              border: "1.5px solid #e2e8f0", borderRadius: 8,
              fontSize: 13, fontFamily: "'DM Sans', sans-serif",
              boxSizing: "border-box", outline: "none", background: "#f8fafc",
            }}
          />
        </div>

        <div style={{
          flex: 1, overflowY: "auto",
          padding: "10px 12px",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          {rooms.map(([room, cs]) => {
            const active = selectedRoom === room;
            const repeat = isRepeat(cs);
            return (
              <button key={room} onClick={() => setSelectedRoom(active ? null : room)}
                style={{
                  background: active ? "var(--blue)" : "#fff",
                  color: active ? "#fff" : "var(--blue-dark)",
                  border: `1.5px solid ${active ? "var(--blue)" : repeat ? "#fecaca" : "#e2e8f0"}`,
                  borderRadius: 10, padding: "10px 14px", cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontFamily: "'DM Sans', sans-serif", textAlign: "left",
                  transition: "all 0.15s", width: "100%",
                  boxShadow: active ? "0 2px 8px rgba(26,58,110,0.18)" : "none",
                }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'JetBrains Mono', monospace" }}>
                    Room {room}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
                    Block {cs[0].block} · {cs.length} complaint{cs.length > 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span style={{
                    background: active ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                    color: active ? "#fff" : "#64748b",
                    borderRadius: 12, padding: "2px 9px", fontSize: 12, fontWeight: 700,
                  }}>
                    {cs.length}
                  </span>
                  {repeat && (
                    <span style={{
                      fontSize: 10, padding: "2px 7px", borderRadius: 4, fontWeight: 700,
                      background: active ? "rgba(220,38,38,0.25)" : "#fef2f2",
                      color: active ? "#fca5a5" : "#dc2626",
                      border: active ? "none" : "1px solid #fecaca",
                    }}>
                      ⚠️ REPEAT
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          {rooms.length === 0 && (
            <div style={{ textAlign: "center", padding: 32, color: "#94a3b8", fontSize: 13 }}>
              No rooms found
            </div>
          )}
        </div>
      </div>

      {/* ── Timeline panel ── */}
      {selectedRoom && (
        <div style={{
          background: "#fff", borderRadius: 12,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          display: "flex", flexDirection: "column",
          height: panelH, overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 20px", borderBottom: "1px solid #f1f5f9", flexShrink: 0,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--blue-dark)" }}>
                Room {selectedRoom} — Complaint Timeline
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                {selected.length} complaint{selected.length !== 1 ? "s" : ""} · Block {selected[0]?.block}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {isRepeat(selected) && (
                <span style={{
                  background: "#fef2f2", color: "#dc2626",
                  border: "1px solid #fecaca", borderRadius: 6,
                  padding: "5px 12px", fontSize: 12, fontWeight: 700,
                }}>
                  ⚠️ Repeat Issue Room
                </span>
              )}
              <button onClick={() => setSelectedRoom(null)} style={{
                background: "#f1f5f9", border: "none", borderRadius: 6,
                width: 30, height: 30, cursor: "pointer", fontSize: 15,
                color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
            </div>
          </div>

          {/* Scrollable timeline */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 24px 28px", position: "relative" }}>
            {/* Vertical connector line */}
            <div style={{
              position: "absolute", left: 40, top: 20, bottom: 24,
              width: 2, background: "#e2e8f0", borderRadius: 1,
            }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[...selected]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(c => {
                  const dotColor = c.status === "resolved"
                    ? "#16a34a"
                    : c.priority === "urgent" ? "#dc2626"
                    : c.priority === "high" ? "#f97316"
                    : c.priority === "medium" ? "#92400e"
                    : "#166534";
                  return (
                    <div key={c.id} style={{ paddingLeft: 32, position: "relative" }}>
                      <div style={{
                        position: "absolute", left: -3, top: 14,
                        width: 18, height: 18, borderRadius: "50%",
                        background: dotColor,
                        border: "3px solid #fff",
                        boxShadow: `0 0 0 2px ${dotColor}`,
                        zIndex: 1,
                      }} />

                      <div style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        padding: "12px 14px",
                      }}>
                        <div style={{
                          display: "flex", justifyContent: "space-between",
                          alignItems: "flex-start", marginBottom: 6,
                        }}>
                          <div style={{
                            fontWeight: 600, fontSize: 14,
                            color: "var(--blue-dark)", flex: 1, paddingRight: 8,
                          }}>
                            {c.isAnonymous ? "Anonymous Complaint" : c.title}
                          </div>
                          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                            <PriorityBadge priority={c.priority} />
                            <StatusBadge status={c.status} />
                          </div>
                        </div>

                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          📅 {new Date(c.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                          {" · "}
                          {c.category.charAt(0).toUpperCase() + c.category.slice(1)}
                          {c.resolvedAt && (
                            <span style={{ color: "#16a34a", marginLeft: 6 }}>· ✓ Resolved</span>
                          )}
                        </div>

                        {c.satisfactionRating && (
                          <div style={{ fontSize: 12, color: "#f59e0b", marginTop: 5 }}>
                            {"★".repeat(c.satisfactionRating)}{"☆".repeat(5 - c.satisfactionRating)}
                            <span style={{ color: "#64748b", marginLeft: 5 }}>student rating</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
