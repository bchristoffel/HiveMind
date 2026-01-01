export type NoteStatus = "draft" | "processed";

export type Note = {
  id: string;
  createdAt: number;
  updatedAt: number;

  rawText: string;

  // AI-enriched fields (Phase 3+)
  title?: string;
  tags: string[];
  people: string[];
  status: NoteStatus;

  // Future: calendar linking
  linkedEventId?: string;
};
