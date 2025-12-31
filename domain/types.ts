export type NoteStatus = "draft" | "processed";

export type Note = {
  id: string;
  createdAt: number;
  updatedAt: number;
  rawText: string;
  title?: string;
  tags: string[];
  people: string[];
  status: NoteStatus;
  linkedEventId?: string;
};
