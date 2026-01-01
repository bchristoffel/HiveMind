import { Note } from "../../domain/types";
import { Task } from "../../domain/tasks";
import { TimelineItem } from "../../domain/timeline";

function short(text: string, max = 90) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + "…";
}

export function buildTimelineStream(params: { notes: Note[]; tasks: Task[] }): TimelineItem[] {
  const { notes, tasks } = params;

  const noteItems: TimelineItem[] = notes.map((n) => {
    const title = n.title ?? (n.rawText.split("\n").find((l) => l.trim())?.trim() || "Note");
    const subtitleParts: string[] = [];

    if (n.tags?.length) subtitleParts.push(n.tags.map((t) => `#${t}`).join(" "));
    if (n.people?.length) subtitleParts.push(n.people.join(", "));

    const subtitle = subtitleParts.length ? subtitleParts.join(" • ") : short(n.rawText, 90);

    return {
      kind: "note",
      ts: n.createdAt,
      id: n.id,
      title: title.length > 60 ? title.slice(0, 57) + "…" : title,
      subtitle,
      noteId: n.id,
      note: n,
    };
  });

  const taskCreatedItems: TimelineItem[] = tasks.map((t) => ({
    kind: "task_created",
    ts: t.createdAt,
    id: `task_created_${t.id}`,
    title: t.title,
    subtitle: "Task created",
    taskId: t.id,
    task: t,
  }));

  const taskCompletedItems: TimelineItem[] = tasks
    .filter((t) => t.status === "done" && typeof t.completedAt === "number")
    .map((t) => ({
      kind: "task_completed",
      ts: t.completedAt as number,
      id: `task_completed_${t.id}`,
      title: t.title,
      subtitle: "Task completed",
      taskId: t.id,
      task: t,
    }));

  const merged = [...noteItems, ...taskCreatedItems, ...taskCompletedItems];

  // Sort newest first
  merged.sort((a, b) => b.ts - a.ts);

  return merged;
}
