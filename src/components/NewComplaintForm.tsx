import React, { useState, useRef, useEffect } from "react";
import { Complaint, Student } from "../types";
import { analyzeComplaint, computeSLA, generateId, generateReceiptId, checkSimilarity } from "../lib/ai";
import { Button, Modal, StarRating } from "./Shared";

interface Props {
  student: Student;
  complaints: Complaint[];
  dailyCount: number;
  onSubmit: (c: Complaint) => void;
}

export const NewComplaintForm: React.FC<Props> = ({ student, complaints, dailyCount, onSubmit }) => {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState<string | undefined>();
  const [preview, setPreview] = useState<ReturnType<typeof analyzeComplaint> | null>(null);
  const [duplicates, setDuplicates] = useState<Complaint[]>([]);
  const [receipt, setReceipt] = useState<Complaint | null>(null);
  const [step, setStep] = useState<"form" | "preview" | "done">("form");
  const recognitionRef = useRef<any>(null);

  const RATE_LIMIT = 3;

  useEffect(() => {
    if (desc.length > 20) {
      const analysis = analyzeComplaint(desc);
      setPreview(analysis);
      // Check duplicates
      const active = complaints.filter(c =>
        c.studentId !== student.id &&
        !c.isPrivate &&
        c.status !== "resolved" &&
        checkSimilarity(desc, c.description) > 0.3
      );
      setDuplicates(active);
    } else {
      setPreview(null);
      setDuplicates([]);
    }
  }, [desc]);

  const startVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice input not supported in this browser. Please use Chrome.");
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-IN";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.onresult = (e: any) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + " ";
      setDesc(t.trim());
      setTranscript(t.trim());
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  const handlePreview = () => {
    if (!desc.trim() || desc.length < 20) {
      alert("Please describe your issue in at least 20 characters.");
      return;
    }
    setStep("preview");
  };

  const handleSubmit = () => {
    if (!preview) return;
    const now = new Date();
    const complaint: Complaint = {
      id: generateId(),
      receiptId: generateReceiptId(),
      studentId: student.id,
      studentName: student.name,
      room: student.room,
      block: student.block,
      category: preview.category,
      title: preview.title,
      description: desc,
      status: "open",
      priority: preview.priority,
      aiTags: preview.tags,
      aiNote: preview.aiNote,
      createdAt: now,
      updatedAt: now,
      sla: computeSLA(preview.priority, now),
      isPrivate,
      isAnonymous,
      wardenNote: "",
      resolutionNote: "",
      resolutionRejectedCount: 0,
      slaBreachEmailSent: false,
      upvotes: [],
      voiceTranscript: transcript,
    };
    onSubmit(complaint);
    setReceipt(complaint);
    setStep("done");
  };

  const handleClose = () => {
    setOpen(false);
    setDesc(""); setIsPrivate(false); setIsAnonymous(false);
    setTranscript(undefined); setPreview(null); setDuplicates([]);
    setReceipt(null); setStep("form");
  };

  const canSubmit = dailyCount < RATE_LIMIT;

  return (
    <>
      <button onClick={() => canSubmit && setOpen(true)} style={{
        background: canSubmit ? "var(--gold)" : "#e2e8f0",
        color: canSubmit ? "var(--blue-dark)" : "#94a3b8",
        border: "none", borderRadius: 8, padding: "12px 24px",
        fontSize: 15, fontWeight: 700, cursor: canSubmit ? "pointer" : "not-allowed",
        fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 8,
        boxShadow: canSubmit ? "0 2px 8px rgba(201,168,76,0.4)" : "none",
        transition: "all 0.2s",
      }}>
        ＋ File New Complaint
        {!canSubmit && <span style={{ fontSize: 11, fontWeight: 400 }}>(limit reached)</span>}
      </button>

      <Modal open={open} onClose={handleClose} title={
        step === "form" ? "File a New Complaint" :
        step === "preview" ? "Review Before Submitting" :
        "Complaint Receipt"
      } width={step === "done" ? 460 : 600}>

        {step === "form" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {dailyCount > 0 && (
              <div style={{
                background: "#fffbeb", border: "1px solid #f59e0b",
                borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "#92400e",
              }}>
                ⚠️ You have filed {dailyCount}/{RATE_LIMIT} complaints today
              </div>
            )}

            {duplicates.length > 0 && (
              <div style={{ background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e40af", marginBottom: 8 }}>
                  📋 Similar complaints already exist — consider upvoting instead:
                </div>
                {duplicates.map(d => (
                  <div key={d.id} style={{
                    background: "#fff", border: "1px solid #bfdbfe", borderRadius: 6,
                    padding: "8px 12px", marginBottom: 6, fontSize: 13,
                  }}>
                    <strong>{d.title}</strong>
                    <span style={{ marginLeft: 8, color: "#64748b" }}>({d.upvotes.length + 1} students affected)</span>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Describe your issue *
              </label>
              <div style={{ position: "relative" }}>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Describe your complaint in detail. Be specific about the location, severity, and how long the issue has been present..."
                  rows={5}
                  style={{
                    width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0",
                    borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                    resize: "vertical", boxSizing: "border-box", outline: "none",
                    lineHeight: 1.6,
                  }}
                />
                <button
                  type="button"
                  onClick={recording ? stopVoice : startVoice}
                  title={recording ? "Stop recording" : "Start voice input (en-IN)"}
                  style={{
                    position: "absolute", bottom: 10, right: 10,
                    background: recording ? "#dc2626" : "var(--blue)",
                    color: "#fff", border: "none", borderRadius: 20,
                    padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 4,
                    animation: recording ? "pulse 1.5s infinite" : "none",
                  }}
                >
                  {recording ? "⏹ Stop" : "🎙 Voice"}
                </button>
              </div>
              {transcript && (
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  🎙 Voice transcript captured
                </div>
              )}
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                {desc.length} characters — AI will auto-generate title and detect priority
              </div>
            </div>

            {preview && desc.length > 20 && (
              <div style={{ background: "var(--cream)", border: "1px solid var(--gold)60", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold-dark)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>
                  🤖 AI ANALYSIS PREVIEW
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                  <div><span style={{ color: "#64748b" }}>Title: </span><strong>{preview.title}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Category: </span><strong>{preview.category}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Priority: </span>
                    <strong style={{ color: preview.priority === "urgent" ? "#dc2626" : preview.priority === "high" ? "#d97706" : "#2563eb" }}>
                      {preview.priority.toUpperCase()}
                    </strong>
                  </div>
                  <div><span style={{ color: "#64748b" }}>Note: </span><small>{preview.aiNote}</small></div>
                </div>
                {preview.tags.length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {preview.tags.map(t => (
                      <span key={t} style={{
                        background: "#fef2f2", color: "#dc2626",
                        border: "1px solid #fecaca", borderRadius: 4,
                        padding: "2px 6px", fontSize: 11,
                      }}>#{t}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)}
                  style={{ width: 16, height: 16 }} />
                🔒 Private (hidden from other students)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)}
                  style={{ width: 16, height: 16 }} />
                👤 Anonymous (name hidden from warden)
              </label>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button onClick={handlePreview} disabled={desc.length < 20}>Review →</Button>
            </div>
          </div>
        )}

        {step === "preview" && preview && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "var(--cream)", border: "1px solid var(--blue)20", borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--blue-dark)", marginBottom: 12 }}>
                {preview.title}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
                <div style={{ color: "#64748b" }}>Category: <strong style={{ color: "#1e293b" }}>{preview.category}</strong></div>
                <div style={{ color: "#64748b" }}>Priority:
                  <strong style={{ marginLeft: 4, color: preview.priority === "urgent" ? "#dc2626" : preview.priority === "high" ? "#d97706" : "#2563eb" }}>
                    {preview.priority.toUpperCase()}
                  </strong>
                </div>
                <div style={{ color: "#64748b" }}>SLA: <strong style={{ color: "#1e293b" }}>
                  {preview.priority === "urgent" ? "4 hours" : preview.priority === "high" ? "24 hours" : preview.priority === "medium" ? "72 hours" : "7 days"}
                </strong></div>
                <div style={{ color: "#64748b" }}>Filed by: <strong style={{ color: "#1e293b" }}>
                  {isAnonymous ? "Anonymous" : student.name}
                </strong></div>
              </div>
              <div style={{ marginTop: 10, padding: "10px 12px", background: "#fff", borderRadius: 6, fontSize: 14, lineHeight: 1.6 }}>
                {desc}
              </div>
              {(isPrivate || isAnonymous) && (
                <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                  {isPrivate && <span style={{ background: "#eff6ff", color: "#1e40af", fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>🔒 Private</span>}
                  {isAnonymous && <span style={{ background: "#f5f3ff", color: "#7c3aed", fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>👤 Anonymous</span>}
                </div>
              )}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", background: "#f8fafc", borderRadius: 6, padding: "10px 14px" }}>
              ℹ️ A tamper-proof receipt with a unique ID will be generated on submission.
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button variant="secondary" onClick={() => setStep("form")}>← Edit</Button>
              <Button variant="gold" onClick={handleSubmit}>Submit Complaint</Button>
            </div>
          </div>
        )}

        {step === "done" && receipt && (
          <div>
            {/* Receipt document - scrollable */}
            <div id="new-complaint-receipt" style={{
              fontFamily: "'DM Sans', sans-serif",
              maxHeight: "65vh", overflowY: "auto", paddingRight: 4,
            }}>

              {/* Institution header */}
              <div style={{ textAlign: "center", paddingBottom: 20, marginBottom: 20, borderBottom: "2px solid var(--gold)" }}>
                <div style={{ fontSize: 34, marginBottom: 8 }}>🏛️</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", fontFamily: "'Tiro Devanagari Hindi', serif", marginBottom: 2 }}>
                  Campus Whisper
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Official Complaint Receipt</div>
              </div>

              {/* Receipt ID box */}
              <div style={{
                border: "1.5px solid #e2e8f0", borderRadius: 8,
                padding: "12px 20px", textAlign: "center",
                marginBottom: 22, background: "#f8fafc",
              }}>
                <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: "0.1em", marginBottom: 4 }}>RECEIPT ID</div>
                <div style={{
                  fontSize: 20, fontWeight: 800, letterSpacing: "0.08em",
                  fontFamily: "'JetBrains Mono', monospace", color: "#1e293b",
                }}>
                  {receipt.receiptId}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                  {new Date(receipt.createdAt).toLocaleString("en-IN")}
                </div>
              </div>

              {/* Fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                <RField label="COMPLAINT ID" value={receipt.id.toUpperCase()} />
                <RField label="FILED BY" value={receipt.isAnonymous ? "Anonymous" : receipt.studentName} />
                <RField label="ROOM / BLOCK" value={`Room ${receipt.room}, Block ${receipt.block}`} />
                <RField label="CATEGORY" value={receipt.category.charAt(0).toUpperCase() + receipt.category.slice(1)} />
                <RField label="SUBJECT" value={receipt.title} />
                <RField label="DESCRIPTION" value={receipt.description} />
                <RField label="PRIORITY (AI ASSESSED)" value={receipt.priority.toUpperCase()} highlight={
                  receipt.priority === "urgent" ? "#dc2626" : receipt.priority === "high" ? "#f97316" : undefined
                } />
                <RField label="SLA DEADLINE" value={new Date(receipt.sla.deadlineAt).toLocaleString("en-IN")} />
                <RField label="SUBMITTED AT" value={new Date(receipt.createdAt).toLocaleString("en-IN")} />
                {receipt.aiTags.length > 0 && (
                  <RField label="AI KEYWORDS" value={receipt.aiTags.join(", ")} />
                )}
              </div>

              {/* Footer */}
              <div style={{ marginTop: 24, paddingTop: 14, borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.6 }}>
                  This receipt is proof that your complaint was officially registered in the Campus Whisper Hostel Grievance System. Keep this receipt ID for future reference.
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 6 }}>Generated automatically · Cannot be altered</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
              <Button variant="ghost" onClick={() => window.print()}>🖨️ Print</Button>
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @media print { body * { visibility: hidden; } #new-complaint-receipt, #new-complaint-receipt * { visibility: visible; } #new-complaint-receipt { position: fixed; top: 0; left: 0; width: 100%; padding: 32px; } }
      `}</style>
    </>
  );
};

const RField: React.FC<{ label: string; value: string; highlight?: string }> = ({ label, value, highlight }) => (
  <div>
    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 600, color: highlight || "#1e293b", lineHeight: 1.5 }}>{value}</div>
  </div>
);
