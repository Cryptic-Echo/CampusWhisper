import { Category, Priority } from "../types";

const URGENT_KEYWORDS = ["flood", "fire", "smoke", "gas", "leak", "electric shock", "no water", "no electricity",
  "sewage", "overflow", "burst", "emergency", "dangerous", "unsafe", "collapsed", "fever", "vomiting",
  "unconscious", "bleeding", "fracture", "allergy", "food poisoning", "health issue", "insect",
  "cockroach", "rat", "snake", "scorpion", "fight", "assault", "harassment", "ragging", "bullying",
  "threat", "injury"];

const HIGH_KEYWORDS = ["not working", "broken", "damaged", "stuck", "no hot water", "mold", "foul smell",
  "theft", "stolen", "missing", "locked out", "stale food", "bad food", "water shortage"];

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  maintenance: ["plumbing", "pipe", "tap", "fan", "light", "ceiling", "wall", "drain", "electricity", "wiring", "geyser", "heater"],
  mess: ["food", "dal", "roti", "hygiene", "stale", "raw", "canteen", "meal", "dinner", "lunch", "breakfast", "cook"],
  room: ["roommate", "transfer", "bed", "mattress", "cupboard", "furniture", "door", "window", "lock"],
  wifi: ["internet", "disconnected", "router", "signal", "bandwidth", "network", "online", "wifi"],
  personal: ["harassment", "conflict", "mental", "stress", "ragging", "bullying", "assault", "fight"],
  health: ["fever", "cold", "cough", "headache", "stomachache", "weakness", "vomiting", "diarrhea", "nausea", "body pain", "chest pain", "breathing", "dizzy", "dizziness", "infection", "rash", "allergy", "medicine", "doctor", "hospital", "sick", "ill", "injury", "wound", "bleeding", "fracture", "unconscious"],
  other: [],
};

export function analyzeComplaint(description: string): {
  priority: Priority;
  category: Category;
  title: string;
  tags: string[];
  aiNote: string;
} {
  const lower = description.toLowerCase();

  // Detect tags
  const tags: string[] = [];
  for (const kw of URGENT_KEYWORDS) {
    if (lower.includes(kw)) tags.push(kw);
  }
  for (const kw of HIGH_KEYWORDS) {
    if (lower.includes(kw)) tags.push(kw);
  }

  // Priority
  let priority: Priority = "low";
  let aiNote = "Low: general complaint";

  for (const kw of URGENT_KEYWORDS) {
    if (lower.includes(kw)) {
      priority = "urgent";
      aiNote = `Urgent: "${kw}" keyword detected`;
      break;
    }
  }

  if (priority !== "urgent") {
    for (const kw of HIGH_KEYWORDS) {
      if (lower.includes(kw)) {
        priority = "high";
        aiNote = `High: "${kw}" keyword detected`;
        break;
      }
    }
  }

  if (priority === "low") {
    const wordCount = description.split(/\s+/).length;
    if (wordCount > 30) { priority = "medium"; aiNote = "Medium: detailed complaint"; }
  }

  // Category
  let category: Category = "other";
  let maxScore = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter(k => lower.includes(k)).length;
    if (score > maxScore) { maxScore = score; category = cat as Category; }
  }

  // Auto-generate title
  const title = generateTitle(description, category, tags);

  return { priority, category, title, tags: [...new Set(tags)], aiNote };
}

function generateTitle(description: string, category: Category, tags: string[]): string {
  const sentences = description.split(/[.!?]/);
  const first = sentences[0]?.trim() || description;

  // If first sentence is short enough, use it
  if (first.length <= 60) return capitalize(first);

  // Otherwise generate from category + first notable keyword
  const catTitles: Record<Category, string> = {
    maintenance: "Maintenance issue",
    mess: "Mess/food complaint",
    room: "Room issue",
    wifi: "Internet/WiFi issue",
    personal: "Personal concern",
    health: "Health issue reported",
    other: "General complaint",
  };

  if (tags.length > 0) {
    return capitalize(`${tags[0]} issue reported`);
  }

  // Extract key noun phrase from first 10 words
  const words = first.split(/\s+/).slice(0, 8).join(" ");
  return words.length > 10 ? capitalize(words) : catTitles[category];
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const SLA_HOURS: Record<Priority, number> = { urgent: 4, high: 24, medium: 72, low: 168 };

export function computeSLA(priority: Priority, createdAt: Date) {
  const deadlineHours = SLA_HOURS[priority];
  const deadlineAt = new Date(createdAt.getTime() + deadlineHours * 3600000);
  const hoursLeft = (deadlineAt.getTime() - Date.now()) / 3600000;
  return { deadlineHours, deadlineAt, breached: hoursLeft < 0, hoursLeft: Math.max(hoursLeft, 0) };
}

export function generateReceiptId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `CW-${year}-${rand}`;
}

export function generateId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function checkSimilarity(desc1: string, desc2: string): number {
  const words1 = new Set(desc1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(desc2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;
  return union === 0 ? 0 : intersection / union;
}

export function updateSLAs(complaints: import("../types").Complaint[]) {
  return complaints.map(c => {
    if (c.status === "resolved") return c;
    const hoursLeft = (c.sla.deadlineAt.getTime() - Date.now()) / 3600000;
    return {
      ...c,
      sla: { ...c.sla, breached: hoursLeft < 0, hoursLeft: Math.max(hoursLeft, 0) },
    };
  });
}
