export type TaskProposal = {
  id: string; // proposal id (not the task id)
  title: string;
  notes?: string;

  // Optional (later we’ll parse dates / priorities)
  dueAt?: number;
  priority?: "low" | "med" | "high";

  // Link back to originating note
  sourceNoteId: string;

  // bookkeeping
  createdAt: number;
};
