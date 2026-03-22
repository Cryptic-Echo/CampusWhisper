import React, { useState, useMemo } from "react";
import { Complaint, Student, Announcement } from "../types";
import { NewComplaintForm } from "../components/NewComplaintForm";
import { AnnouncementBanners } from "../components/AnnouncementPanel";
import {
  PriorityBadge, StatusBadge, CategoryBadge, SLATimer, Button, Card, Modal, StarRating, EmptyState
} from "../components/Shared";

interface Props {
  student: Student;
  complaints: Complaint[];
  announcements: Announcement[];
  onNewComplaint: (c: Complaint) => void;
  onUpvote: (id: string) => void;
  onConfirmResolution: (id: string, confirmed: boolean) => void;
  onRateResolution: (id: string, rating: number, comment: string) => void;
  onLogout: () => void;
}

type Tab = "my" | "all" | "announcements" | "room";

export const StudentPortal: React.FC<Props> = ({
  student, complaints, announcements, onNewComplaint, onUpvote,
  onConfirmResolution, onRateResolution, onLogout,
}) => {
  const [tab, setTab] = useState<Tab>("my");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [ratingModal, setRatingModal] = useState<Complaint | null>(null);
  const [receiptModal, setReceiptModal] = useState<Complaint | null>(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const roomComplaints = useMemo(() =>
    complaints
      .filter(c => c.room === student.room && !c.isPrivate)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [complaints, student.room]
  );

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dailyCount = complaints.filter(c =>
    c.studentId === student.id && new Date(c.createdAt) >= today
  ).length;

  const myComplaints = useMemo(() =>
    complaints.filter(c => c.studentId === student.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [complaints, student.id]
  );

  const allComplaints = useMemo(() =>
    complaints.filter(c => !c.isPrivate && c.studentId !== student.id)
      .filter(c => filterStatus === "all" || c.status === filterStatus)
      .filter(c => filterPriority === "all" || c.priority === filterPriority)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [complaints, student.id, filterStatus, filterPriority]
  );

  const pendingConfirmation = myComplaints.filter(c => c.status === "pending_confirmation" && c.studentConfirmed === undefined);
  const urgentCount = complaints.filter(c => c.priority === "urgent" && c.status !== "resolved").length;

  const handleConfirm = (id: string, confirmed: boolean) => {
    onConfirmResolution(id, confirmed);
    setSelectedComplaint(null);
  };

  const handleRating = () => {
    if (!ratingModal || rating === 0) return;
    onRateResolution(ratingModal.id, rating, ratingComment);
    setRatingModal(null);
    setRating(0);
    setRatingComment("");
  };

  return (
    <div style={{ height: "100vh", background: "var(--cream)", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <header style={{
        background: "var(--blue-dark)", borderBottom: "3px solid var(--gold)",
        padding: "0", position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 12px rgba(6,16,31,0.3)",
      }}>
        <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, paddingLeft: 100 }}>
            <img src="/logo.png" alt="Logo" style={{ width: 57.6, height: 57.6, borderRadius: 13, objectFit: "cover" }} />
            <div>
              <div style={{ fontSize: 28.8, fontWeight: 700, color: "#fff", fontFamily: "'Tiro Devanagari Hindi', serif" }}>
                Campus Whisper
              </div>
              <div style={{ fontSize: 17.6, color: "rgba(255,255,255,0.5)", marginTop: -2 }}>Student Portal</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, paddingRight: 70 }}>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 26 }}>
              <strong style={{ color: "var(--gold)" }}>{student.name}</strong>
              <span style={{ marginLeft: 12, color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace", fontSize: 22 }}>
                {student.room}
              </span>
            </div>
            <Button variant="ghost" size="lg" onClick={onLogout} style={{
              color: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(255,255,255,0.25)",
              fontSize: 22, padding: "10px 28px",
            }}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div style={{ background: "#f0f4f8", height: "calc(100vh - 123px)", overflow: "hidden" }}>
        <div style={{ height: "100%", maxWidth: 1440, margin: "0 auto", padding: "20px 40px", display: "flex", gap: 28, boxSizing: "border-box" }}>

          {/* ── LEFT SIDEBAR ── */}
          <aside style={{
            width: 325, flexShrink: 0, height: "100%",
            display: "flex", flexDirection: "column", gap: 16,
            overflowY: "auto", paddingRight: 6, paddingBottom: 16,
          }}>

            {/* Student card */}
            <div style={{
              background: "linear-gradient(145deg, var(--blue-dark), var(--blue))",
              borderRadius: 16, padding: "24px 22px",
              boxShadow: "0 4px 20px rgba(26,58,110,0.25)",
            }}>
              <div style={{
                width: 58, height: 58, borderRadius: "50%", marginBottom: 14,
                background: "linear-gradient(135deg, var(--gold), var(--gold-dark))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 800, color: "var(--blue-dark)",
              }}>
                {student.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{student.name}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 16 }}>
                {student.course} · Year {student.year}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Room", value: student.room },
                  { label: "Block", value: student.block },
                ].map(i => (
                  <div key={i.label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 9, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{i.label}</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "var(--gold)", fontFamily: "'JetBrains Mono', monospace", marginTop: 3 }}>{i.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "18px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>My Stats</div>
              {[
                { label: "Total Filed", value: myComplaints.length, color: "#1a3a6e", icon: "📋" },
                { label: "Active", value: myComplaints.filter(c => c.status !== "resolved").length, color: "#dc2626", icon: "🔴" },
                { label: "Resolved", value: myComplaints.filter(c => c.status === "resolved").length, color: "#16a34a", icon: "✅" },
                { label: "Room History", value: roomComplaints.length, color: "#92400e", icon: "🏠" },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 15 }}>{s.icon}</span>
                    <span style={{ fontSize: 14, color: "#374151" }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* File complaint CTA */}
            <div style={{ background: "var(--cream)", borderRadius: 14, padding: "18px", border: "1px solid var(--cream-dark)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--blue-dark)", marginBottom: 7 }}>Have an issue?</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16, lineHeight: 1.5 }}>
                File a complaint and the warden will be notified immediately.
              </div>
              <NewComplaintForm student={student} complaints={complaints} dailyCount={dailyCount} onSubmit={onNewComplaint} />
              {dailyCount > 0 && (
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 10, textAlign: "center" }}>
                  {dailyCount}/3 complaints filed today
                </div>
              )}
            </div>

          </aside>

          {/* ── MAIN CONTENT ── */}
          <div style={{ flex: 1, minWidth: 0, height: "100%", overflowY: "auto", paddingBottom: 24, paddingRight: 4 }}>

          {/* Pending confirmation banner */}
          {pendingConfirmation.length > 0 && (
            <div style={{
              background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
              border: "1.5px solid #c4b5fd", borderRadius: 12,
              padding: "16px 20px", marginBottom: 20,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              boxShadow: "0 2px 8px rgba(124,58,237,0.12)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 24 }}>⏳</div>
                <div>
                  <div style={{ fontWeight: 700, color: "#7c3aed", fontSize: 14 }}>Awaiting your confirmation</div>
                  <div style={{ color: "#6d28d9", fontSize: 12.5, marginTop: 2 }}>
                    {pendingConfirmation.length} complaint{pendingConfirmation.length > 1 ? "s" : ""} marked as resolved — please confirm to close
                  </div>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setTab("my")} style={{ borderColor: "#7c3aed", color: "#7c3aed", fontWeight: 700 }}>
                Review Now →
              </Button>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 2, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              {([
                { key: "my", label: "My Complaints", count: myComplaints.length },
                { key: "all", label: "All Complaints", count: allComplaints.length },
                { key: "room", label: "🏠 Room History", count: roomComplaints.length },
                { key: "announcements", label: "📢 Notices", count: announcements.length },
              ] as { key: Tab; label: string; count: number }[]).map(t => (
                <button key={t.key} onClick={() => setTab(t.key as Tab)} style={{
                  padding: "8px 16px", border: "none", borderRadius: 7,
                  background: tab === t.key ? "var(--blue)" : "transparent",
                  color: tab === t.key ? "#fff" : "#64748b",
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
                }}>
                  {t.label}
                  <span style={{
                    background: tab === t.key ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                    color: tab === t.key ? "#fff" : "#94a3b8",
                    borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 700,
                  }}>{t.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* All tab filters */}
          {tab === "all" && (
            <div style={{
              background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0",
              padding: "12px 16px", marginBottom: 16,
              display: "flex", gap: 10, alignItems: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="in_progress">In Progress</option>
                <option value="pending_confirmation">Pending Confirmation</option>
                <option value="resolved">Resolved</option>
                <option value="reopened">Reopened</option>
              </select>
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={selectStyle}>
                <option value="all">All Priority</option>
                <option value="urgent">🚨 Urgent</option>
                <option value="high">⚠️ High</option>
                <option value="medium">📋 Medium</option>
                <option value="low">📌 Low</option>
              </select>
              <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>{allComplaints.length} result{allComplaints.length !== 1 ? "s" : ""}</span>
            </div>
          )}

          {/* Complaint lists */}
          {tab !== "announcements" && tab !== "room" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(tab === "my" ? myComplaints : allComplaints).map(c => (
                <ComplaintCard
                  key={c.id}
                  complaint={c}
                  isOwner={c.studentId === student.id}
                  hasUpvoted={c.upvotes.includes(student.id)}
                  onUpvote={() => onUpvote(c.id)}
                  onClick={() => setSelectedComplaint(c)}
                  onConfirm={() => setSelectedComplaint(c)}
                  onRate={() => { setRatingModal(c); setRating(c.satisfactionRating || 0); setRatingComment(c.satisfactionComment || ""); }}
                  onViewReceipt={() => setReceiptModal(c)}
                />
              ))}
              {(tab === "my" ? myComplaints : allComplaints).length === 0 && (
                <div style={{
                  background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
                  padding: "60px 20px", textAlign: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ fontSize: 52, marginBottom: 14 }}>{tab === "my" ? "📋" : "🔍"}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                    {tab === "my" ? "No complaints filed yet" : "No complaints found"}
                  </div>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>
                    {tab === "my" ? "Use the button above to file your first complaint" : "Try adjusting your filters"}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "room" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Room banner */}
              <div style={{
                background: "linear-gradient(135deg, var(--blue-dark), var(--blue))",
                borderRadius: 14, padding: "20px 24px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                boxShadow: "0 4px 16px rgba(26,58,110,0.2)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 12,
                    background: "rgba(201,168,76,0.2)", border: "2px solid rgba(201,168,76,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                  }}>🏠</div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'JetBrains Mono', monospace" }}>Room {student.room}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>Block {student.block} · {roomComplaints.length} complaint{roomComplaints.length !== 1 ? "s" : ""} on record</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Active issues</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "var(--gold)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {roomComplaints.filter(c => c.status !== "resolved").length}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: "#94a3b8", background: "#fff", borderRadius: 8, padding: "9px 16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 6 }}>
                <span>🔒</span> Private complaints are hidden. Only non-private complaints from Room {student.room} are shown here.
              </div>

              {roomComplaints.length > 0 ? (
                <div style={{ position: "relative", paddingLeft: 32 }}>
                  <div style={{ position: "absolute", left: 10, top: 12, bottom: 12, width: 2, background: "#e2e8f0", borderRadius: 1 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {roomComplaints.map(c => {
                      const dotColor = c.status === "resolved" ? "#16a34a"
                        : c.priority === "urgent" ? "#dc2626"
                        : c.priority === "high" ? "#f97316"
                        : c.priority === "medium" ? "#92400e"
                        : "#166534";
                      return (
                        <div key={c.id} style={{ position: "relative" }}>
                          <div style={{
                            position: "absolute", left: -26, top: 16,
                            width: 18, height: 18, borderRadius: "50%",
                            background: dotColor, border: "3px solid #f0f4f8",
                            boxShadow: `0 0 0 2px ${dotColor}`, zIndex: 1,
                          }} />
                          <div style={{
                            background: "#fff", borderRadius: 12,
                            border: `1px solid ${c.sla.breached ? "#fecaca" : "#e2e8f0"}`,
                            borderLeft: `4px solid ${dotColor}`,
                            padding: "14px 18px",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                              <div style={{ flex: 1, paddingRight: 12 }}>
                                <div style={{ display: "flex", gap: 5, marginBottom: 7, flexWrap: "wrap" }}>
                                  <PriorityBadge priority={c.priority} />
                                  <StatusBadge status={c.status} />
                                  <CategoryBadge category={c.category} />
                                  {c.isAnonymous && <span style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", padding: "2px 7px", borderRadius: 4, fontSize: 11 }}>👤 Anonymous</span>}
                                </div>
                                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--blue-dark)", marginBottom: 4 }}>
                                  {c.isAnonymous ? "Anonymous Complaint" : c.title}
                                </div>
                                <div style={{ fontSize: 12.5, color: "#64748b" }}>
                                  {c.isAnonymous ? "Filed anonymously" : `Filed by ${c.studentId === student.id ? "you" : c.studentName}`}
                                  {" · "}
                                  {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </div>
                              </div>
                              <SLATimer hoursLeft={c.sla.hoursLeft} breached={c.sla.breached} deadlineHours={c.sla.deadlineHours} />
                            </div>
                            {c.resolutionNote && (
                              <div style={{ marginTop: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "7px 12px", fontSize: 12.5, color: "#166534" }}>
                                ✓ {c.resolutionNote}
                              </div>
                            )}
                            {c.satisfactionRating && (
                              <div style={{ marginTop: 6, fontSize: 13, color: "#f59e0b" }}>
                                {"★".repeat(c.satisfactionRating)}{"☆".repeat(5 - c.satisfactionRating)}
                                <span style={{ color: "#94a3b8", marginLeft: 6, fontSize: 12 }}>rating given</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "60px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 52, marginBottom: 14 }}>🏠</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#374151", marginBottom: 6 }}>No complaints for this room</div>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>Your room has a clean record!</div>
                </div>
              )}
            </div>
          )}

          {tab === "announcements" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {announcements.filter(a => a.affectedBlocks.includes("All") || a.affectedBlocks.includes(student.block)).map(a => {
                const catIcon = a.category === "emergency" ? "🚨" : a.category === "maintenance" ? "🔧" : a.category === "event" ? "🎉" : "📢";
                const catColor = a.category === "emergency" ? "#dc2626" : a.category === "maintenance" ? "#f59e0b" : a.category === "event" ? "#16a34a" : "#1a3a6e";
                const catBg = a.category === "emergency" ? "#fef2f2" : a.category === "maintenance" ? "#fffbeb" : a.category === "event" ? "#f0fdf4" : "#eff6ff";
                return (
                  <div key={a.id} style={{
                    background: "#fff", borderRadius: 12,
                    border: `1px solid ${catColor}20`,
                    borderLeft: `4px solid ${catColor}`,
                    padding: "16px 20px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 10, background: catBg,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0,
                      }}>{catIcon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--blue-dark)", marginBottom: 4 }}>{a.title}</div>
                        <div style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.6, marginBottom: 8 }}>{a.description}</div>
                        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#94a3b8" }}>
                          <span>📅 {new Date(a.startTime).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} — {new Date(a.endTime).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                          <span>🏠 Blocks: {a.affectedBlocks.join(", ")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {announcements.length === 0 && (
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "60px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 52, marginBottom: 14 }}>📢</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#374151" }}>No announcements</div>
                </div>
              )}
            </div>
          )}

          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        aside::-webkit-scrollbar { width: 0px; }
        @media print { body * { visibility: hidden; } #receipt-content, #receipt-content * { visibility: visible; } #receipt-content { position: fixed; top: 0; left: 0; width: 100%; padding: 32px; } }
      `}</style>

      {/* Receipt Modal */}
      {receiptModal && (
        <Modal open onClose={() => setReceiptModal(null)} title="" width={440}>
          <div id="receipt-content" style={{ fontFamily: "'DM Sans', sans-serif", padding: "0 4px" }}>

            {/* Institution header */}
            <div style={{ textAlign: "center", paddingBottom: 20, marginBottom: 20, borderBottom: "2px solid var(--gold)" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🏛️</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", fontFamily: "'Tiro Devanagari Hindi', serif", marginBottom: 2 }}>
                Campus Whisper
              </div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Official Complaint Receipt</div>
            </div>

            {/* Receipt ID box */}
            <div style={{
              border: "1.5px solid #e2e8f0", borderRadius: 8,
              padding: "12px 20px", textAlign: "center",
              marginBottom: 24, background: "#f8fafc",
            }}>
              <div style={{
                fontSize: 20, fontWeight: 800, letterSpacing: "0.08em",
                fontFamily: "'JetBrains Mono', monospace", color: "#1e293b",
              }}>
                {receiptModal.receiptId}
              </div>
            </div>

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <RF label="COMPLAINT ID" value={receiptModal.id.toUpperCase()} />
              <RF label="FILED BY" value={receiptModal.isAnonymous ? "Anonymous" : receiptModal.studentName} />
              <RF label="ROOM / BLOCK" value={"Room " + receiptModal.room + ", Block " + receiptModal.block} />
              <RF label="CATEGORY" value={receiptModal.category.charAt(0).toUpperCase() + receiptModal.category.slice(1)} />
              <RF label="SUBJECT" value={receiptModal.title} />
              <RF label="DESCRIPTION" value={receiptModal.description} />
              <RF label="PRIORITY (AI ASSESSED)" value={receiptModal.priority.toUpperCase()} highlight={
                receiptModal.priority === "urgent" ? "#dc2626" : receiptModal.priority === "high" ? "#f97316" : undefined
              } />
              <RF label="SLA DEADLINE" value={new Date(receiptModal.sla.deadlineAt).toLocaleString("en-IN")} />
              <RF label="SUBMITTED AT" value={new Date(receiptModal.createdAt).toLocaleString("en-IN")} />
              <RF label="STATUS" value={receiptModal.status.replace(/_/g, " ").replace(/\w/g, (l: string) => l.toUpperCase())} />
              {receiptModal.wardenNote && <RF label="WARDEN NOTE" value={receiptModal.wardenNote} />}
              {receiptModal.resolutionNote && <RF label="RESOLUTION" value={receiptModal.resolutionNote} />}
              {receiptModal.aiTags.length > 0 && <RF label="AI KEYWORDS" value={receiptModal.aiTags.join(", ")} />}
            </div>

            {/* Footer */}
            <div style={{ marginTop: 28, paddingTop: 16, borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#374151", marginBottom: 4 }}>
                This receipt is proof that your complaint was officially registered in the Campus Whisper Hostel Grievance System. Keep this receipt ID for future reference.
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>Generated automatically · Cannot be altered</div>
            </div>
          </div>

          <div style={{ marginTop: 24, display: "flex", gap: 8, justifyContent: "center" }}>
            <Button variant="ghost" onClick={() => setReceiptModal(null)}>Close</Button>
            <Button variant="gold" onClick={() => window.print()}>🖨️ Print Receipt</Button>
          </div>
        </Modal>
      )}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          isOwner={selectedComplaint.studentId === student.id}
          studentId={student.id}
          onClose={() => setSelectedComplaint(null)}
          onUpvote={() => onUpvote(selectedComplaint.id)}
          hasUpvoted={selectedComplaint.upvotes.includes(student.id)}
          onConfirm={handleConfirm}
          onRate={() => { setRatingModal(selectedComplaint); setSelectedComplaint(null); }}
        />
      )}

      {/* Rating Modal */}
      {ratingModal && (
        <Modal open onClose={() => setRatingModal(null)} title="Rate Resolution" width={400}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 14, color: "#374151" }}>How satisfied are you with the resolution?</div>
            <div style={{ textAlign: "center" }}>
              <StarRating value={rating} onChange={setRating} />
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
                {rating === 0 ? "Select a rating" : ["", "Very Poor", "Poor", "Average", "Good", "Excellent"][rating]}
              </div>
            </div>
            <textarea
              value={ratingComment}
              onChange={e => setRatingComment(e.target.value)}
              placeholder="Optional comment..."
              rows={3}
              style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", resize: "none" }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setRatingModal(null)}>Cancel</Button>
              <Button variant="gold" onClick={handleRating} disabled={rating === 0}>Submit Rating</Button>
            </div>
          </div>
        </Modal>
      )}


    </div>
  );
};

const ComplaintCard: React.FC<{
  complaint: Complaint;
  isOwner: boolean;
  hasUpvoted: boolean;
  onUpvote: () => void;
  onClick: () => void;
  onConfirm: () => void;
  onRate: () => void;
  onViewReceipt: () => void;
}> = ({ complaint: c, isOwner, hasUpvoted, onUpvote, onClick, onConfirm, onRate, onViewReceipt }) => {
  const accentColor = c.sla.breached ? "#ef4444"
    : c.priority === "urgent" ? "#dc2626"
    : c.priority === "high" ? "#f97316"
    : c.priority === "medium" ? "#92400e"
    : "#166534";

  return (
    <div style={{
      background: "#fff", borderRadius: 14,
      border: `1px solid ${c.sla.breached || c.priority === "urgent" ? accentColor + "40" : "#e2e8f0"}`,
      borderLeft: `4px solid ${accentColor}`,
      boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
      overflow: "hidden", transition: "box-shadow 0.15s, transform 0.15s",
    }}>
      {/* Main clickable area */}
      <div onClick={onClick} style={{ padding: "16px 20px", cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", flex: 1 }}>
            <PriorityBadge priority={c.priority} />
            <StatusBadge status={c.status} />
            <CategoryBadge category={c.category} />
            {c.sla.breached && <span style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>⏰ SLA BREACHED</span>}
            {c.isAnonymous && isOwner && <span style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>👤 Anonymous</span>}
            {c.isPrivate && isOwner && <span style={{ background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>🔒 Private</span>}
          </div>
          <span style={{ fontSize: 11.5, color: "#94a3b8", flexShrink: 0, marginLeft: 10 }}>
            {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </div>

        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--blue-dark)", marginBottom: 5 }}>
          {c.isAnonymous && !isOwner ? "Anonymous Complaint" : c.title}
        </div>

        {(!c.isPrivate || isOwner) && (
          <div style={{ fontSize: 13.5, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 10, lineHeight: 1.5 }}>
            {c.description}
          </div>
        )}

        <SLATimer hoursLeft={c.sla.hoursLeft} breached={c.sla.breached} deadlineHours={c.sla.deadlineHours} />
      </div>

      {/* Action footer */}
      <div style={{
        padding: "10px 20px", background: "#fafbfc",
        borderTop: "1px solid #f1f5f9",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!isOwner && c.status !== "resolved" && (
            <button onClick={e => { e.stopPropagation(); onUpvote(); }} style={{
              background: hasUpvoted ? "var(--blue)" : "#f1f5f9",
              color: hasUpvoted ? "#fff" : "#64748b",
              border: `1.5px solid ${hasUpvoted ? "var(--blue)" : "#e2e8f0"}`,
              borderRadius: 8, padding: "5px 14px",
              cursor: "pointer", fontSize: 12.5, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s",
            }}>
              👍 {c.upvotes.length + 1} affected
            </button>
          )}
          {isOwner && (
            <button onClick={e => { e.stopPropagation(); onViewReceipt(); }} style={{
              background: "none", border: "1.5px solid #e2e8f0", borderRadius: 7,
              padding: "4px 12px", cursor: "pointer", fontSize: 11.5, fontWeight: 600,
              color: "var(--blue)", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 5,
            }}>
              🧾 View Receipt
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isOwner && c.status === "pending_confirmation" && c.studentConfirmed === undefined && (
            <Button size="sm" variant="gold" onClick={e => { e.stopPropagation(); onConfirm(); }}>
              ✓ Confirm Resolution
            </Button>
          )}
          {isOwner && c.status === "resolved" && c.studentConfirmed && !c.satisfactionRating && (
            <Button size="sm" variant="secondary" onClick={e => { e.stopPropagation(); onRate(); }}>
              ★ Rate Resolution
            </Button>
          )}
          {isOwner && c.satisfactionRating && (
            <span style={{ fontSize: 14, color: "#f59e0b" }}>{"★".repeat(c.satisfactionRating)}{"☆".repeat(5 - c.satisfactionRating)}</span>
          )}
          <button onClick={e => { e.stopPropagation(); onClick(); }} style={{
            background: "none", border: "1.5px solid #e2e8f0", borderRadius: 8,
            padding: "5px 14px", cursor: "pointer", fontSize: 12.5, fontWeight: 600,
            color: "#64748b", fontFamily: "'DM Sans', sans-serif",
          }}>
            View →
          </button>
        </div>
      </div>
    </div>
  );
};

const ComplaintDetailModal: React.FC<{
  complaint: Complaint;
  isOwner: boolean;
  studentId: string;
  onClose: () => void;
  onUpvote: () => void;
  hasUpvoted: boolean;
  onConfirm: (id: string, confirmed: boolean) => void;
  onRate: () => void;
}> = ({ complaint: c, isOwner, studentId, onClose, onUpvote, hasUpvoted, onConfirm, onRate }) => (
  <Modal open onClose={onClose} title="Complaint Details" width={600}>
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <PriorityBadge priority={c.priority} />
        <StatusBadge status={c.status} />
        <CategoryBadge category={c.category} />
      </div>

      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--blue-dark)", marginBottom: 4 }}>{c.title}</div>
        <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{c.description}</div>
        {c.voiceTranscript && (
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>🎙 Filed via voice</div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
        {isOwner && <Info label="Receipt ID" value={c.receiptId} mono />}
        <Info label="Filed" value={new Date(c.createdAt).toLocaleString("en-IN")} />
        <Info label="Room" value={`${c.room} (Block ${c.block})`} />
        <Info label="Filed by" value={c.isAnonymous ? "Anonymous" : c.studentName} />
        <Info label="SLA" value={c.sla.breached ? "BREACHED ⚠️" : `${Math.ceil(c.sla.hoursLeft)}h remaining`} />
        <Info label="Tags" value={c.aiTags.length ? c.aiTags.join(", ") : "—"} />
      </div>

      {c.aiTags.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {c.aiTags.map(t => (
            <span key={t} style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 4, padding: "2px 8px", fontSize: 11 }}>#{t}</span>
          ))}
        </div>
      )}

      {c.wardenNote && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>WARDEN NOTE</div>
          <div style={{ fontSize: 13, color: "#78350f" }}>{c.wardenNote}</div>
        </div>
      )}

      {c.resolutionNote && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#14532d", marginBottom: 4 }}>RESOLUTION NOTE</div>
          <div style={{ fontSize: 13, color: "#166534" }}>{c.resolutionNote}</div>
        </div>
      )}

      {c.resolutionRejectedCount > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "#dc2626" }}>
          ⚠️ Resolution was rejected {c.resolutionRejectedCount} time{c.resolutionRejectedCount > 1 ? "s" : ""}
        </div>
      )}

      {c.sla.breached && c.status !== "resolved" && (
        <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", marginBottom: 6 }}>
            ⏰ SLA Deadline Breached
          </div>
          <div style={{ fontSize: 13, color: "#7f1d1d", marginBottom: 10 }}>
            This complaint has exceeded its resolution deadline. You may escalate directly to the Chief Warden.
          </div>
          <a
            href={`mailto:chiefwarden@soa.ac.in?subject=SLA Breach Escalation — ${encodeURIComponent(c.receiptId)}&body=${encodeURIComponent(
              `Dear Chief Warden,\n\nI am writing to escalate a hostel grievance that has exceeded its SLA deadline and remains unresolved.\n\nComplaint Details:\n• Receipt ID: ${c.receiptId}\n• Title: ${c.title}\n• Category: ${c.category}\n• Priority: ${c.priority.toUpperCase()}\n• Filed On: ${new Date(c.createdAt).toLocaleString("en-IN")}\n• SLA Deadline: ${new Date(c.sla.deadlineAt).toLocaleString("en-IN")}\n• Current Status: ${c.status}\n\nIssue Description:\n${c.description}\n\nKindly look into this matter at the earliest.\n\nRegards,\n${c.isAnonymous ? "A concerned student" : c.studentName}\nRoom ${c.room}, Block ${c.block}`
            )}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#dc2626", color: "#fff",
              padding: "9px 18px", borderRadius: 6,
              fontSize: 13, fontWeight: 700,
              textDecoration: "none", fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 2px 8px rgba(220,38,38,0.3)",
            }}
          >
            📧 Inform Chief Warden
          </a>
        </div>
      )}

      {isOwner && c.status === "pending_confirmation" && c.studentConfirmed === undefined && (
        <div style={{ background: "#f5f3ff", border: "1.5px solid #c4b5fd", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#7c3aed", marginBottom: 10 }}>
            Has this issue been resolved to your satisfaction?
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="primary" onClick={() => onConfirm(c.id, true)} style={{ background: "#16a34a", borderColor: "#16a34a" }}>
              ✓ Yes, It's Fixed
            </Button>
            <Button variant="danger" onClick={() => onConfirm(c.id, false)}>
              ✗ No, Still Broken
            </Button>
          </div>
        </div>
      )}

      {isOwner && c.status === "resolved" && c.studentConfirmed && !c.satisfactionRating && (
        <div style={{ textAlign: "center" }}>
          <Button variant="gold" onClick={onRate}>★ Rate this resolution</Button>
        </div>
      )}

      {c.satisfactionRating && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>Your rating:</span>
          <span style={{ fontSize: 16, color: "#f59e0b" }}>{"★".repeat(c.satisfactionRating)}{"☆".repeat(5 - c.satisfactionRating)}</span>
          {c.satisfactionComment && <span style={{ fontSize: 13, color: "#64748b", fontStyle: "italic" }}>"{c.satisfactionComment}"</span>}
        </div>
      )}

      {!isOwner && c.status !== "resolved" && (
        <Button
          variant={hasUpvoted ? "secondary" : "primary"}
          onClick={onUpvote}
          fullWidth
        >
          {hasUpvoted ? "✓ You've indicated this affects you" : "👍 I'm also affected by this issue"}
        </Button>
      )}
    </div>
  </Modal>
);

const RF: React.FC<{ label: string; value: string; highlight?: string }> = ({ label, value, highlight }) => (
  <div>
    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 600, color: highlight || "#1e293b", lineHeight: 1.5 }}>{value}</div>
  </div>
);

const ReceiptRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px" }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1e293b", fontFamily: mono ? "'JetBrains Mono', monospace" : undefined }}>{value}</div>
  </div>
);

const Info: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 13, color: "#1e293b", fontFamily: mono ? "'JetBrains Mono', monospace" : undefined }}>{value}</div>
  </div>
);

const selectStyle: React.CSSProperties = {
  padding: "7px 12px", border: "1.5px solid #e2e8f0", borderRadius: 6,
  fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: "#fff",
  cursor: "pointer", outline: "none",
};
