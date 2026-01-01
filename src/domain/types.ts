export type NoteStatus = "draft" | "processed";
export type NoteSource = "capture" | "import_text" | "import_email" | "import_message" | "import_note" | "import_web" | "import_other";

export type Note = {
  id: string;
  createdAt: number;
  updatedAt: number;

  rawText: string;

  // AI-enriched fields
  title?: string;
  tags: string[];
  people: string[];
  status: NoteStatus;

  // Calendar linking
  linkedEventId?: string;

  // Where it came from
  source?: NoteSource;
};
