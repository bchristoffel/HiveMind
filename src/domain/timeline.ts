import { Note } from "./types";
import { Task } from "./tasks";

export type TimelineItemKind = "note" | "task_created" | "task_completed";

export type TimelineItem = {
  kind: TimelineItemKind;

  // Used for grouping & sorting
  ts: number;

  // Primary id for navigation
  id: string;

  // Render fields
  title: string;
  subtitle?: string;

  // Optional links
  noteId?: string;
  taskId?: string;

  // Raw data (optional)
  note?: Note;
  task?: Task;
};
