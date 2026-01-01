export type NoteStatus = "draft" | "processed";

export type Note = {
  id: string;
  createdAt: number;
  updatedAt: number;

  rawText: string;

  // Future: AI-structured fields
  title?: string;
  tags: string[];
  people: string[];
  status: NoteStatus;

  // Future: calendar linking
  linkedEventId?: string;
};
