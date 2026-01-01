import { Task } from "../../domain/tasks";
import { Note } from "../../domain/types";

export type PriorityItem =
  | { kind: "task"; id: string; title: string; score: number; detail: string; dueAt?: number }
  | { kind: "note"; id: string; title: string; score: number; detail: string };

function hoursUntil(ts: number) {
  return (ts - Date.now()) / (1000 * 60 * 60);
}

function scoreTask(t: Task): PriorityItem {
  // Base score
  let score = 10;

  // Priority flag
  if (t.priority === "high") score += 40;
  if (t.priority === "med") score += 20;
  if (t.priority === "low") score += 5;

  // Due date urgency
  let detail = "Open task";
  if (t.dueAt) {
    const h = hoursUntil(t.dueAt);
    if (h < 0) {
      score += 80;
      detail = "Overdue";
    } else if (h <= 24) {
      score += 60;
      detail = "Due today";
    } else if (h <= 72) {
      score += 35;
      detail = "Due soon";
    } else {
      score += 10;
      detail = "Has due date";
    }
  }

  // “Action-ish” verbs bump (helps without due dates)
  const lower = t.title.toLowerCase();
  const verbs = ["email", "call", "send", "submit", "schedule", "book", "review", "pay", "follow up"];
  if (verbs.some((v) => lower.startsWith(v))) score += 10;

  // Short tasks get a slight bump (easy wins)
  if (t.title.length <= 22) score += 6;

  return { kind: "task", id: t.id, title: t.title, score, detail, dueAt: t.dueAt };
}

function scoreNoteNeedingProcessing(n: Note): PriorityItem {
  // Notes that are drafts are a priority because they likely contain actions to extract
  let score = 25;

  // Very recent drafts get a bump (fresh context)
  const ageHours = (Date.now() - n.createdAt) / (1000 * 60 * 60);
  if (ageHours <= 2) score += 20;
  else if (ageHours <= 24) score += 12;

  // Long raw text = likely more value to process
  if (n.rawText.length >= 200) score += 10;
  if (n.rawText.length >= 600) score += 10;

  const title = n.title ?? (n.rawText.split("\n").find((l) => l.trim())?.trim() || "Draft note");
  const detail = "Needs processing";

  return { kind: "note", id: n.id, title: title.length > 60 ? title.slice(0, 57) + "…" : title, score, detail };
}

export function getTopPriorities(params: {
  tasks: Task[];
  notes: Note[];
  maxItems?: number;
}): PriorityItem[] {
  const maxItems = params.maxItems ?? 3;

  const openTasks = params.tasks.filter((t) => t.status === "open");
  const draftNotes = params.notes.filter((n) => n.status === "draft");

  const scored: PriorityItem[] = [
    ...openTasks.map(scoreTask),
    ...draftNotes.map(scoreNoteNeedingProcessing),
  ];

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxItems);
}
