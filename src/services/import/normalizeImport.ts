export type ImportSource = "text" | "email" | "message" | "note" | "web" | "image_ocr" | "voice";

export function normalizeImportedText(params: { source: ImportSource; raw: string }): string {
  const raw = params.raw.trim();

  const header = `[Imported • ${params.source}]`;
  if (!raw) return `${header}\n\n`;

  // Keep it simple + readable
  return `${header}\n\n${raw}`;
}
