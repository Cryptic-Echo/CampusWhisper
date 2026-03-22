import React, { useState } from "react";
import { Student } from "../types";
import { Button, Card, Modal } from "./Shared";

interface Props {
  students: Student[];
  onAdd: (s: Student) => void;
  onRemove: (id: string) => void;
}

export const StudentManager: React.FC<Props> = ({ students, onAdd, onRemove }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", room: "", block: "A", email: "", phone: "", course: "", year: 1 });
  const [search, setSearch] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.room.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.name.trim() || !form.room.trim()) return;
    const id = `s${String(students.length + 1).padStart(3, "0")}`;
    onAdd({
      ...form,
      id,
      password: "hostel",
      year: Number(form.year),
    });
    setForm({ name: "", room: "", block: "A", email: "", phone: "", course: "", year: 1 });
    setOpen(false);
  };

  const input = (label: string, key: keyof typeof form, type = "text") => (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>{label}</label>
      {key === "block" ? (
        <select value={form.block} onChange={e => setForm(f => ({ ...f, block: e.target.value }))} style={inputStyle}>
          {["A", "B", "C", "D"].map(b => <option key={b}>{b}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={form[key] as any}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={inputStyle}
        />
      )}
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
          <input
            placeholder="Search students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 32, width: 220 }}
          />
        </div>
        <Button onClick={() => setOpen(true)} size="sm">+ Add Student</Button>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {filtered.map(s => (
          <Card key={s.id} style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: `linear-gradient(135deg, var(--blue), var(--blue-mid))`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 14,
                }}>
                  {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--blue-dark)" }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {s.id} · Room {s.room} · Block {s.block} · {s.course} Y{s.year}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>
                  {s.email}
                </span>
                <Button variant="danger" size="sm" onClick={() => setConfirmRemove(s.id)}>Remove</Button>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>No students found</div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add New Student" width={480}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {input("Full Name *", "name")}
          {input("Room Number *", "room")}
          {input("Block", "block")}
          {input("Email", "email", "email")}
          {input("Phone", "phone", "tel")}
          {input("Course", "course")}
          {input("Year", "year", "number")}
        </div>
        <div style={{ marginTop: 16, padding: "10px 12px", background: "var(--cream)", borderRadius: 6, fontSize: 13, color: "#64748b" }}>
          Default password: <strong style={{ fontFamily: "monospace" }}>hostel</strong>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!form.name.trim() || !form.room.trim()}>Add Student</Button>
        </div>
      </Modal>

      <Modal open={!!confirmRemove} onClose={() => setConfirmRemove(null)} title="Confirm Remove Student" width={380}>
        <p style={{ color: "#374151", marginTop: 0 }}>
          Are you sure you want to remove <strong>{students.find(s => s.id === confirmRemove)?.name}</strong> from the system?
          This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setConfirmRemove(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (confirmRemove) { onRemove(confirmRemove); setConfirmRemove(null); } }}>
            Remove Student
          </Button>
        </div>
      </Modal>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", border: "1.5px solid #e2e8f0",
  borderRadius: 6, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box", outline: "none",
};
