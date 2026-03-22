import React, { useState, useEffect } from "react";
import { LoginPage } from "./pages/LoginPage";
import { StudentPortal } from "./pages/StudentPortal";
import { WardenPortal } from "./pages/WardenPortal";
import { User, Complaint, Student, Announcement, Status } from "./types";
import { STUDENTS as INIT_STUDENTS, SEED_COMPLAINTS, SEED_ANNOUNCEMENTS, WARDEN } from "./lib/data";
import { updateSLAs } from "./lib/ai";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>(SEED_COMPLAINTS);
  const [students, setStudents] = useState<Student[]>(INIT_STUDENTS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(SEED_ANNOUNCEMENTS);

  // SLA ticker — update every minute
  useEffect(() => {
    const tick = () => setComplaints(prev => updateSLAs(prev) as Complaint[]);
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  // Browser tab title badge
  useEffect(() => {
    const urgent = complaints.filter(c => c.priority === "urgent" && c.status !== "resolved").length;
    document.title = urgent > 0 ? `(${urgent}) Campus Whisper` : "Campus Whisper";
  }, [complaints]);

  const handleLogin = (u: User) => setUser(u);
  const handleLogout = () => setUser(null);

  const handleNewComplaint = (c: Complaint) => {
    setComplaints(prev => [c, ...prev]);
  };

  const handleUpvote = (id: string) => {
    if (!user) return;
    setComplaints(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (c.upvotes.includes(user.id)) return { ...c, upvotes: c.upvotes.filter(u => u !== user.id) };
      return { ...c, upvotes: [...c.upvotes, user.id] };
    }));
  };

  const handleUpdateStatus = (id: string, status: Status, note?: string) => {
    setComplaints(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updates: Partial<Complaint> = { status, updatedAt: new Date() };
      if (status === "pending_confirmation" && note) {
        updates.resolutionNote = note;
        updates.resolvedAt = new Date();
      } else if (note) {
        updates.wardenNote = note;
      }
      return { ...c, ...updates };
    }));
  };

  const handleConfirmResolution = (id: string, confirmed: boolean) => {
    setComplaints(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (confirmed) {
        return { ...c, status: "resolved", studentConfirmed: true, updatedAt: new Date() };
      } else {
        return {
          ...c, status: "reopened", studentConfirmed: false,
          studentRejectedAt: new Date(),
          resolutionRejectedCount: c.resolutionRejectedCount + 1,
          resolutionNote: "",
          updatedAt: new Date(),
        };
      }
    }));
  };

  const handleRateResolution = (id: string, rating: number, comment: string) => {
    setComplaints(prev => prev.map(c =>
      c.id === id ? { ...c, satisfactionRating: rating, satisfactionComment: comment } : c
    ));
  };

  const handleSendSLABreach = (id: string) => {
    const c = complaints.find(x => x.id === id);
    const student = c ? students.find(s => s.id === c.studentId) : null;
    if (!c || !student) return;

    setComplaints(prev => prev.map(x => x.id === id ? { ...x, slaBreachEmailSent: true } : x));

    const subject = `Reminder: Please Confirm Resolution — ${c.receiptId}`;
    const body = `Dear ${c.isAnonymous ? "Student" : student.name},\n\nThis is a reminder regarding your hostel complaint that is pending your confirmation.\n\nComplaint Details:\n• Receipt ID: ${c.receiptId}\n• Title: ${c.title}\n• Category: ${c.category}\n• Priority: ${c.priority.toUpperCase()}\n• Filed On: ${new Date(c.createdAt).toLocaleString("en-IN")}\n\nResolution Note from Warden:\n${c.resolutionNote || "The warden has indicated this issue has been addressed."}\n\nPlease log in to Campus Whisper and confirm whether your issue has been fully resolved:\n✅ If resolved — mark it as confirmed\n❌ If not resolved — reject it so we can take further action\n\nYour feedback is important to us.\n\nRegards,\nDr. Ramesh Patnaik\nHostel Warden, ITER SOA University`;

    window.location.href = `mailto:${student.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleAddStudent = (s: Student) => setStudents(prev => [...prev, s]);
  const handleRemoveStudent = (id: string) => setStudents(prev => prev.filter(s => s.id !== id));
  const handleAddAnnouncement = (a: Announcement) => setAnnouncements(prev => [...prev, a]);
  const handleRemoveAnnouncement = (id: string) => setAnnouncements(prev => prev.filter(a => a.id !== id));

  if (!user) return <LoginPage onLogin={handleLogin} />;

  if (user.role === "warden") {
    return (
      <WardenPortal
        wardenName={user.name}
        complaints={complaints}
        students={students}
        announcements={announcements}
        onUpdateStatus={handleUpdateStatus}
        onSendSLABreach={handleSendSLABreach}
        onAddStudent={handleAddStudent}
        onRemoveStudent={handleRemoveStudent}
        onAddAnnouncement={handleAddAnnouncement}
        onRemoveAnnouncement={handleRemoveAnnouncement}
        onLogout={handleLogout}
      />
    );
  }

  const student = students.find(s => s.id === user.id);
  if (!student) return <div>Student not found</div>;

  return (
    <StudentPortal
      student={student}
      complaints={complaints}
      announcements={announcements}
      onNewComplaint={handleNewComplaint}
      onUpvote={handleUpvote}
      onConfirmResolution={handleConfirmResolution}
      onRateResolution={handleRateResolution}
      onLogout={handleLogout}
    />
  );
}

export default App;
