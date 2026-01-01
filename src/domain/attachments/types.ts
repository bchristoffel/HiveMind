export type AttachmentKind = "image" | "audio" | "drawing";

export type DrawingPoint = { x: number; y: number };
export type DrawingStroke = { points: DrawingPoint[] };

export type NoteAttachment = {
  id: string;
  kind: AttachmentKind;
  createdAt: number;

  // For image/audio we store a URI (file:// on device, blob/http on web)
  uri?: string;
  mimeType?: string;

  // Optional metadata
  width?: number;
  height?: number;
  durationMs?: number;

  // For drawings we store strokes in JSON (no file)
  strokes?: DrawingStroke[];
};
