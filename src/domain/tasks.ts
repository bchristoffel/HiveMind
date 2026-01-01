export type TaskStatus = "open" | "done";

export type Task = {
  id: string;
  createdAt: number;
  updatedAt: number;

  title: string;
  notes?: string;

  status: TaskStatus;
  completedAt?: number;

  // Optional scheduling
  dueAt?: number;

  // Links
  sourceNoteId?: string;

  // Prioritization (later we’ll calculate automatically)
  priority?: "low" | "med" | "high";
};
