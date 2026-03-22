export type Category = "maintenance" | "mess" | "room" | "wifi" | "other" | "personal" | "health";
export type Priority = "low" | "medium" | "high" | "urgent";
export type Status = "open" | "acknowledged" | "in_progress" | "pending_confirmation" | "resolved" | "reopened";

export interface SLA {
  deadlineHours: number;
  deadlineAt: Date;
  breached: boolean;
  hoursLeft: number;
}

export interface Complaint {
  id: string;
  receiptId: string;
  studentId: string;
  studentName: string;
  room: string;
  block: string;
  category: Category;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  aiTags: string[];
  aiNote: string;
  createdAt: Date;
  updatedAt: Date;
  sla: SLA;
  isPrivate: boolean;
  isAnonymous: boolean;
  wardenNote: string;
  resolutionNote: string;
  resolvedAt?: Date;
  studentConfirmed?: boolean;
  studentRejectedAt?: Date;
  resolutionRejectedCount: number;
  satisfactionRating?: number;
  satisfactionComment?: string;
  slaBreachEmailSent: boolean;
  upvotes: string[];
  groupId?: string;
  duplicateOf?: string;
  voiceTranscript?: string;
}

export interface Student {
  id: string;
  name: string;
  room: string;
  block: string;
  email: string;
  phone: string;
  course: string;
  year: number;
  password: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  affectedBlocks: string[];
  startTime: Date;
  endTime: Date;
  category: "maintenance" | "event" | "notice" | "emergency";
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

export interface User {
  id: string;
  role: "student" | "warden";
  name: string;
}
