import React, { useState, useMemo } from "react";
import { Complaint, Student, Announcement, Status } from "../types";
import { StudentManager } from "../components/StudentManager";
import { RoomHistory } from "../components/RoomHistory";
import { AnnouncementPanel } from "../components/AnnouncementPanel";
import {
  PriorityBadge, StatusBadge, CategoryBadge, SLATimer, Button, Modal, EmptyState
} from "../components/Shared";

interface Props {
  wardenName: string;
  complaints: Complaint[];
  students: Student[];
  announcements: Announcement[];
  onUpdateStatus: (id: string, status: Status, note?: string) => void;
  onSendSLABreach: (id: string) => void;
  onAddStudent: (s: Student) => void;
  onRemoveStudent: (id: string) => void;
  onAddAnnouncement: (a: Announcement) => void;
  onRemoveAnnouncement: (id: string) => void;
  onLogout: () => void;
}

type Tab = "complaints" | "analytics" | "students" | "rooms" | "announcements";

const NAV: { key: Tab; label: string; icon: string }[] = [
  { key: "complaints", label: "Complaints", icon: "📋" },
  { key: "analytics", label: "Analytics", icon: "📊" },
  { key: "students", label: "Students", icon: "👥" },
  { key: "rooms", label: "Room History", icon: "🏠" },
  { key: "announcements", label: "Announcements", icon: "📢" },
];

export const WardenPortal: React.FC<Props> = ({
  wardenName, complaints, students, announcements,
  onUpdateStatus, onSendSLABreach, onAddStudent, onRemoveStudent,
  onAddAnnouncement, onRemoveAnnouncement, onLogout,
}) => {
  const [tab, setTab] = useState<Tab>("complaints");
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [resolveModal, setResolveModal] = useState<Complaint | null>(null);
  const [resNote, setResNote] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [newStatus, setNewStatus] = useState<Status>("acknowledged");
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterBlock, setFilterBlock] = useState("all");
  const [search, setSearch] = useState("");

  const urgentBreached = complaints.filter(c => c.priority === "urgent" && c.sla.breached && c.status !== "resolved");

  const kpis = [
    { label: "Active", value: complaints.filter(c => c.status !== "resolved").length, color: "#ef4444", bg: "#fef2f2", icon: "🔴" },
    { label: "In Progress", value: complaints.filter(c => c.status === "in_progress" || c.status === "acknowledged").length, color: "#f59e0b", bg: "#fffbeb", icon: "🟡" },
    { label: "Awaiting Student", value: complaints.filter(c => c.status === "pending_confirmation").length, color: "#8b5cf6", bg: "#f5f3ff", icon: "⏳" },
    { label: "Resolved", value: complaints.filter(c => c.status === "resolved").length, color: "#10b981", bg: "#f0fdf4", icon: "✅" },
    { label: "SLA Breached", value: complaints.filter(c => c.sla.breached && c.status !== "resolved").length, color: "#dc2626", bg: "#fef2f2", icon: "⏰" },
    { label: "Students", value: students.length, color: "#1a3a6e", bg: "#eff6ff", icon: "🎓" },
  ];

  const filtered = useMemo(() => complaints
    .filter(c => filterStatus === "active" ? c.status !== "resolved" : filterStatus === "all" ? true : c.status === filterStatus)
    .filter(c => filterPriority === "all" || c.priority === filterPriority)
    .filter(c => filterBlock === "all" || c.block === filterBlock)
    .filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.receiptId.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.sla.breached && !b.sla.breached) return -1;
      if (!a.sla.breached && b.sla.breached) return 1;
      return a.sla.hoursLeft - b.sla.hoursLeft;
    }), [complaints, filterStatus, filterPriority, filterBlock, search]);

  const handleResolve = () => {
    if (!resolveModal || !resNote.trim()) return;
    onUpdateStatus(resolveModal.id, "pending_confirmation", resNote.trim());
    setResolveModal(null); setResNote(""); setSelected(null);
  };

  const handleStatusChange = (c: Complaint) => {
    onUpdateStatus(c.id, newStatus, statusNote.trim() || undefined);
    setSelected(null); setStatusNote(""); setNewStatus("acknowledged");
  };

  const initials = wardenName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const currentNav = NAV.find(n => n.key === tab)!;

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#f0f4f8" }}>

      {/* ══ SIDEBAR ══ */}
      <aside style={{
        width: 248, flexShrink: 0, background: "var(--blue-dark)",
        display: "flex", flexDirection: "column",
        position: "fixed", inset: "0 auto 0 0", zIndex: 200,
        boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
      }}>
        {/* Brand */}
        <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <img src="/logo.png" alt="Logo" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "'Tiro Devanagari Hindi', serif", lineHeight: 1.2 }}>
                Campus Whisper
              </div>
              <div style={{ fontSize: 10.8, color: "var(--gold)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>
                Warden Portal
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0 8px", marginBottom: 8 }}>
            Main Menu
          </div>
          {NAV.map(item => {
            const active = tab === item.key;
            const badge = item.key === "complaints"
              ? complaints.filter(c => c.status !== "resolved").length
              : item.key === "students" ? students.length
              : item.key === "announcements" ? announcements.length : 0;
            return (
              <button key={item.key} onClick={() => setTab(item.key)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 9, border: "none",
                background: active ? "rgba(201,168,76,0.13)" : "transparent",
                color: active ? "var(--gold)" : "rgba(255,255,255,0.5)",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                fontWeight: active ? 700 : 500, fontSize: 13.5,
                width: "100%", textAlign: "left",
                outline: active ? "1px solid rgba(201,168,76,0.22)" : "none",
                transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 17, width: 22, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {badge > 0 && (
                  <span style={{
                    background: active ? "var(--gold)" : "rgba(255,255,255,0.09)",
                    color: active ? "var(--blue-dark)" : "rgba(255,255,255,0.45)",
                    borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700,
                  }}>{badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Urgent breach alert — clickable */}
        {urgentBreached.length > 0 && (
          <button
            onClick={() => {
              setTab("complaints");
              setFilterStatus("active");
              setFilterPriority("urgent");
              setFilterBlock("all");
              setSearch("");
            }}
            style={{
              margin: "0 12px 12px",
              background: "linear-gradient(135deg, rgba(220,38,38,0.18), rgba(220,38,38,0.08))",
              border: "1px solid rgba(220,38,38,0.3)", borderRadius: 10, padding: "11px 14px",
              cursor: "pointer", width: "calc(100% - 24px)", textAlign: "left",
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, animation: "pulse 1.5s infinite" }}>🚨</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fca5a5" }}>
                  {urgentBreached.length} Urgent Breach{urgentBreached.length > 1 ? "es" : ""}
                </span>
              </div>
              <span style={{ fontSize: 11, color: "rgba(252,165,165,0.5)" }}>→</span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(252,165,165,0.6)", lineHeight: 1.4 }}>
              Tap to view now
            </div>
          </button>
        )}

        {/* Profile */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, var(--gold), var(--gold-dark))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "var(--blue-dark)",
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {wardenName}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Hostel Warden</div>
          </div>
          <button onClick={onLogout} title="Sign out" style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 7, cursor: "pointer", color: "rgba(255,255,255,0.35)",
            width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, flexShrink: 0, transition: "all 0.15s",
          }}>↩</button>
        </div>
      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <div style={{ marginLeft: 248, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* Top bar */}
        <header style={{
          background: "#fff", borderBottom: "1px solid #e2e8f0",
          padding: "0 28px", height: 66,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 100,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--blue-dark)", fontFamily: "'Tiro Devanagari Hindi', serif" }}>
              {currentNav.icon} {currentNav.label}
            </h1>
            <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 1 }}>
              ITER, SOA University · Hostel Grievance System
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {tab === "complaints" && (
              <span style={{ fontSize: 12.5, color: "#64748b", background: "#f1f5f9", padding: "5px 14px", borderRadius: 20, border: "1px solid #e2e8f0" }}>
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
            )}
            <div style={{ fontSize: 12.5, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "6px 14px", borderRadius: 8 }}>
              📅 {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
            </div>
          </div>
        </header>

        {/* KPI strip */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 28px", display: "flex", gap: 12 }}>
          {kpis.map(k => (
            <div key={k.label} style={{
              flex: 1, background: k.bg, borderRadius: 10,
              padding: "11px 14px", display: "flex", alignItems: "center", gap: 10,
              border: `1px solid ${k.color}18`,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 9, background: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17, boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              }}>{k.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: k.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                  {k.value}
                </div>
                <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2, whiteSpace: "nowrap" }}>{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Page body */}
        <main style={{ flex: 1, padding: "24px 28px" }}>

          {tab === "complaints" && (
            <>
              {/* Filter bar */}
              <div style={{
                background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
                padding: "14px 18px", marginBottom: 16,
                display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}>
                <div style={{ position: "relative", flex: "1 1 200px" }}>
                  <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, pointerEvents: "none" }}>🔍</span>
                  <input placeholder="Search complaints…" value={search} onChange={e => setSearch(e.target.value)}
                    style={{ ...fStyle, paddingLeft: 34, width: "100%", boxSizing: "border-box" }} />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={fStyle}>
                  <option value="active">Active Complaints</option>
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending_confirmation">Pending Confirmation</option>
                  <option value="resolved">Resolved</option>
                  <option value="reopened">Reopened</option>
                </select>
                <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={fStyle}>
                  <option value="all">All Priority</option>
                  <option value="urgent">🚨 Urgent</option>
                  <option value="high">⚠️ High</option>
                  <option value="medium">📋 Medium</option>
                  <option value="low">📌 Low</option>
                </select>
                <select value={filterBlock} onChange={e => setFilterBlock(e.target.value)} style={fStyle}>
                  <option value="all">All Blocks</option>
                  {["A", "B", "C", "D"].map(b => <option key={b} value={b}>Block {b}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map(c => (
                  <WardenComplaintCard
                    key={c.id} complaint={c}
                    onOpen={() => setSelected(c)}
                    onResolve={() => { setResolveModal(c); setResNote(""); }}
                    onSendBreachEmail={() => onSendSLABreach(c.id)}
                  />
                ))}
                {filtered.length === 0 && <EmptyState icon="📭" message="No complaints found" sub="Try adjusting your filters" />}
              </div>
            </>
          )}

          {tab === "analytics" && <AnalyticsDashboard complaints={complaints} students={students} />}
          {tab === "students" && <StudentManager students={students} onAdd={onAddStudent} onRemove={onRemoveStudent} />}
          {tab === "rooms" && <RoomHistory complaints={complaints} />}
          {tab === "announcements" && (
            <AnnouncementPanel announcements={announcements} isWarden onAdd={onAddAnnouncement} onRemove={onRemoveAnnouncement} />
          )}
        </main>
      </div>

      {/* ══ DETAIL MODAL ══ */}
      {selected && (
        <Modal open onClose={() => setSelected(null)} title="Complaint Details" width={660}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <PriorityBadge priority={selected.priority} />
              <StatusBadge status={selected.status} />
              <CategoryBadge category={selected.category} />
              {selected.sla.breached && <span style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>⏰ SLA BREACHED</span>}
              {selected.isAnonymous && <span style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>👤 Anonymous</span>}
            </div>

            <div style={{ background: "var(--cream)", borderRadius: 10, padding: "14px 16px", border: "1px solid var(--cream-dark)" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--blue-dark)", marginBottom: 6 }}>{selected.title}</div>
              <div style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.75 }}>{selected.description}</div>
              {selected.voiceTranscript && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>🎙 Submitted via voice</div>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <InfoRow label="Receipt ID" value={selected.receiptId} mono />
              <InfoRow label="Filed By" value={selected.isAnonymous ? "Anonymous" : selected.studentName} />
              <InfoRow label="Room" value={`${selected.room} · Block ${selected.block}`} />
              <InfoRow label="Filed On" value={new Date(selected.createdAt).toLocaleString("en-IN")} />
              <InfoRow label="SLA Status" value={selected.sla.breached ? "⚠️ BREACHED" : `${Math.ceil(selected.sla.hoursLeft)}h remaining`} />
              <InfoRow label="AI Note" value={selected.aiNote} />
            </div>

            {selected.aiTags.length > 0 && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {selected.aiTags.map(t => <span key={t} style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 4, padding: "2px 8px", fontSize: 11 }}>#{t}</span>)}
              </div>
            )}

            {selected.wardenNote && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", marginBottom: 4, letterSpacing: "0.05em" }}>WARDEN NOTE</div>
                <div style={{ fontSize: 13, color: "#78350f" }}>{selected.wardenNote}</div>
              </div>
            )}

            {selected.resolutionNote && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#14532d", marginBottom: 4, letterSpacing: "0.05em" }}>RESOLUTION NOTE</div>
                <div style={{ fontSize: 13, color: "#166534" }}>{selected.resolutionNote}</div>
              </div>
            )}

            {selected.satisfactionRating && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fffbeb", borderRadius: 8, padding: "10px 14px" }}>
                <span style={{ fontSize: 12, color: "#92400e", fontWeight: 600 }}>Student Rating:</span>
                <span style={{ fontSize: 18, color: "#f59e0b" }}>{"★".repeat(selected.satisfactionRating)}{"☆".repeat(5 - selected.satisfactionRating)}</span>
                {selected.satisfactionComment && <span style={{ fontSize: 12, color: "#78350f", fontStyle: "italic" }}>"{selected.satisfactionComment}"</span>}
              </div>
            )}

            {selected.status !== "resolved" && selected.status !== "pending_confirmation" && (
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Update Status</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value as Status)} style={{ ...fStyle, flex: 1 }}>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                </div>
                <input value={statusNote} onChange={e => setStatusNote(e.target.value)}
                  placeholder="Add a note for the student (optional)…"
                  style={{ ...fStyle, width: "100%", marginBottom: 10, boxSizing: "border-box" }} />
                <Button size="sm" onClick={() => handleStatusChange(selected)}>Update Status</Button>
              </div>
            )}

            {selected.status !== "resolved" && (
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="gold" onClick={() => { setResolveModal(selected); setSelected(null); setResNote(""); }} fullWidth>
                  ✓ Mark as Resolved
                </Button>
                {selected.status === "pending_confirmation" && selected.sla.breached && !selected.slaBreachEmailSent && (
                  <Button variant="danger" onClick={() => { onSendSLABreach(selected.id); setSelected(null); }}>
                    📧 Remind Student
                  </Button>
                )}
                {selected.status === "pending_confirmation" && selected.slaBreachEmailSent && <span style={{ fontSize: 12, color: "#16a34a", alignSelf: "center", whiteSpace: "nowrap" }}>✓ Reminder sent</span>}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ══ RESOLVE MODAL ══ */}
      {resolveModal && (
        <Modal open onClose={() => setResolveModal(null)} title="Mark Complaint as Resolved" width={500}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "var(--cream)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#374151" }}>
              <strong style={{ color: "var(--blue-dark)" }}>{resolveModal.title}</strong>
              <span style={{ color: "#94a3b8", marginLeft: 8, fontSize: 11, fontFamily: "monospace" }}>{resolveModal.receiptId}</span>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Resolution Note <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <textarea
                value={resNote} onChange={e => setResNote(e.target.value)}
                placeholder="Describe exactly what was done to fix this issue. This note will be sent to the student for their confirmation."
                rows={4}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }}
              />
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 5 }}>
                The student must confirm resolution before the complaint is fully closed.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setResolveModal(null)}>Cancel</Button>
              <Button variant="gold" onClick={handleResolve} disabled={!resNote.trim()}>Submit & Notify Student</Button>
            </div>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        aside button:hover:not(:disabled) { background: rgba(255,255,255,0.07) !important; color: rgba(255,255,255,0.82) !important; transform: none !important; filter: none !important; }
        .breach-btn:hover { background: linear-gradient(135deg, rgba(220,38,38,0.28), rgba(220,38,38,0.15)) !important; border-color: rgba(220,38,38,0.5) !important; }
      `}</style>
    </div>
  );
};

/* ══ COMPLAINT CARD ══ */
const WardenComplaintCard: React.FC<{
  complaint: Complaint;
  onOpen: () => void;
  onResolve: () => void;
  onSendBreachEmail: () => void;
}> = ({ complaint: c, onOpen, onResolve, onSendBreachEmail }) => {
  const accentColor = c.sla.breached ? "#ef4444" : c.priority === "urgent" ? "#dc2626" : c.priority === "high" ? "#f97316" : c.priority === "medium" ? "#3b82f6" : "#94a3b8";
  return (
    <div style={{
      background: "#fff", borderRadius: 12,
      border: `1px solid ${c.sla.breached || c.priority === "urgent" ? accentColor + "55" : "#e2e8f0"}`,
      borderLeft: `4px solid ${accentColor}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      overflow: "hidden",
    }}>
      <div onClick={onOpen} style={{ padding: "14px 18px", cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
            <PriorityBadge priority={c.priority} />
            <StatusBadge status={c.status} />
            <CategoryBadge category={c.category} />
            {c.sla.breached && <span style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>⏰ BREACHED</span>}
            {c.isAnonymous && <span style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", padding: "2px 7px", borderRadius: 4, fontSize: 11 }}>👤 Anon</span>}
          </div>
          <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0, marginLeft: 10 }}>
            {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--blue-dark)", marginBottom: 5 }}>{c.title}</div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 12.5, color: "#64748b" }}>{c.isAnonymous ? "👤 Anonymous" : `👤 ${c.studentName}`}</span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>🏠 Room {c.room} · Block {c.block}</span>
          {c.upvotes.length > 0 && <span style={{ fontSize: 12, color: "#64748b" }}>👍 {c.upvotes.length + 1} affected</span>}
        </div>
        <SLATimer hoursLeft={c.sla.hoursLeft} breached={c.sla.breached} deadlineHours={c.sla.deadlineHours} />
      </div>

      <div style={{ padding: "10px 18px", background: "#fafbfc", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>{c.receiptId}</span>
        <div style={{ display: "flex", gap: 7 }}>
          {c.status === "pending_confirmation" && c.sla.breached && !c.slaBreachEmailSent && (
            <Button variant="danger" size="sm" onClick={e => { e.stopPropagation(); onSendBreachEmail(); }}>📧 Remind Student</Button>
          )}
          {c.status === "pending_confirmation" && c.slaBreachEmailSent && <span style={{ fontSize: 11, color: "#16a34a", alignSelf: "center" }}>✓ Reminder sent</span>}
          {c.status === "pending_confirmation" && <span style={{ fontSize: 11, color: "#7c3aed", alignSelf: "center" }}>⏳ Awaiting student</span>}
          {c.status !== "resolved" && c.status !== "pending_confirmation" && (
            <Button variant="gold" size="sm" onClick={e => { e.stopPropagation(); onResolve(); }}>✓ Resolve</Button>
          )}
          <Button variant="secondary" size="sm" onClick={e => { e.stopPropagation(); onOpen(); }}>View →</Button>
        </div>
      </div>
    </div>
  );
};

/* ══ ANALYTICS ══ */
const AnalyticsDashboard: React.FC<{ complaints: Complaint[]; students: Student[] }> = ({ complaints, students }) => {
  const resolved = complaints.filter(c => c.status === "resolved");
  const avgResTime = resolved.filter(c => c.resolvedAt).length > 0
    ? resolved.filter(c => c.resolvedAt).reduce((s, c) => s + (new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime()) / 3600000, 0) / resolved.filter(c => c.resolvedAt).length
    : 0;
  const avgRating = resolved.filter(c => c.satisfactionRating).length > 0
    ? resolved.filter(c => c.satisfactionRating).reduce((s, c) => s + (c.satisfactionRating || 0), 0) / resolved.filter(c => c.satisfactionRating).length
    : 0;
  const breachRate = complaints.length > 0 ? (complaints.filter(c => c.sla.breached).length / complaints.length * 100).toFixed(1) : "0";

  const blockStats = ["A", "B", "C", "D"].map(b => ({
    block: b,
    total: complaints.filter(c => c.block === b).length,
    open: complaints.filter(c => c.block === b && c.status !== "resolved").length,
  })).sort((a, b) => b.total - a.total);

  const days7: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days7.push({ day: d.toLocaleDateString("en-IN", { weekday: "short" }), count: complaints.filter(c => new Date(c.createdAt).toDateString() === d.toDateString()).length });
  }
  const max7 = Math.max(...days7.map(d => d.count), 1);

  const catCounts: Record<string, number> = {};
  for (const c of complaints) catCounts[c.category] = (catCounts[c.category] || 0) + 1;
  const catIcons: Record<string, string> = { maintenance: "🔧", mess: "🍽️", room: "🛏️", wifi: "📶", personal: "🔒", other: "📝" };
  const catColors = ["#1a3a6e", "#2454a0", "#c9a84c", "#8b5cf6", "#ef4444", "#10b981"];

  const panelStyle: React.CSSProperties = {
    background: "#fff", borderRadius: 12, padding: "20px 24px",
    border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  };
  const headStyle: React.CSSProperties = { fontWeight: 700, fontSize: 14, color: "var(--blue-dark)", marginBottom: 3 };
  const subStyle: React.CSSProperties = { fontSize: 11, color: "#94a3b8", marginBottom: 18 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Avg Resolution Time", value: avgResTime > 0 ? `${avgResTime.toFixed(1)}h` : "—", icon: "⏱️", color: "#1a3a6e", sub: "per complaint" },
          { label: "Avg Satisfaction", value: avgRating > 0 ? `${avgRating.toFixed(1)} ★` : "—", icon: "😊", color: "#f59e0b", sub: "out of 5 stars" },
          { label: "SLA Breach Rate", value: `${breachRate}%`, icon: "⚠️", color: "#dc2626", sub: "of all complaints" },
          { label: "Enrolled Students", value: String(students.length), icon: "🎓", color: "#10b981", sub: "across 4 blocks" },
        ].map(k => (
          <div key={k.label} style={panelStyle}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{k.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{k.label}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 14 }}>
        {/* 7-day chart */}
        <div style={panelStyle}>
          <div style={headStyle}>📈 Weekly Complaint Report</div>
          <div style={subStyle}>New complaints filed per day</div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 130 }}>
            {days7.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{d.count || ""}</div>
                <div style={{
                  width: "100%", borderRadius: "5px 5px 0 0",
                  height: `${Math.max((d.count / max7) * 105, d.count > 0 ? 12 : 3)}px`,
                  background: d.count > 0 ? "linear-gradient(180deg, var(--blue-mid), var(--blue))" : "#f1f5f9",
                  transition: "height 0.5s ease",
                }} />
                <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{d.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority split */}
        <div style={panelStyle}>
          <div style={headStyle}>🎯 Priority Split</div>
          <div style={subStyle}>Distribution across priority levels</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { p: "urgent", color: "#dc2626", label: "Urgent" },
              { p: "high", color: "#f59e0b", label: "High" },
              { p: "medium", color: "#3b82f6", label: "Medium" },
              { p: "low", color: "#10b981", label: "Low" },
            ].map(({ p, color, label }) => {
              const cnt = complaints.filter(c => c.priority === p).length;
              const pct = complaints.length > 0 ? (cnt / complaints.length) * 100 : 0;
              return (
                <div key={p}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12.5 }}>
                    <span style={{ fontWeight: 600, color: "#374151" }}>{label}</span>
                    <span style={{ color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>{cnt} · {pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 7, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Block heatmap */}
        <div style={panelStyle}>
          <div style={headStyle}>🏠 Block Activity</div>
          <div style={subStyle}>Complaints by hostel block</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {blockStats.map((b, i) => (
              <div key={b.block}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: i === 0 ? "#fef2f2" : i === 1 ? "#fffbeb" : "#f0fdf4",
                      color: i === 0 ? "#dc2626" : i === 1 ? "#d97706" : "#16a34a",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 800,
                    }}>{b.block}</div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Block {b.block}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    <strong style={{ color: "#1e293b" }}>{b.total}</strong> total · <strong style={{ color: "#ef4444" }}>{b.open}</strong> active
                  </span>
                </div>
                <div style={{ height: 7, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 4, transition: "width 0.5s ease",
                    background: i === 0 ? "linear-gradient(90deg, #dc2626, #ef4444)"
                      : i === 1 ? "linear-gradient(90deg, #d97706, #f59e0b)"
                      : "linear-gradient(90deg, var(--blue), var(--blue-mid))",
                    width: `${blockStats[0].total > 0 ? (b.total / blockStats[0].total) * 100 : 0}%`,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div style={panelStyle}>
          <div style={headStyle}>📊 Category Breakdown</div>
          <div style={subStyle}>Types of issues reported</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(catCounts).sort(([, a], [, b]) => b - a).map(([cat, cnt], i) => {
              const pct = complaints.length > 0 ? (cnt / complaints.length) * 100 : 0;
              return (
                <div key={cat}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12.5 }}>
                    <span style={{ fontWeight: 500, color: "#374151" }}>{catIcons[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                    <span style={{ color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>{cnt} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: catColors[i % catColors.length], borderRadius: 3, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 13, color: "#1e293b", fontFamily: mono ? "'JetBrains Mono', monospace" : undefined, fontWeight: mono ? 600 : 400 }}>{value}</div>
  </div>
);

const fStyle: React.CSSProperties = {
  padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8,
  fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: "#fff",
  cursor: "pointer", outline: "none", color: "#374151",
};
