export type NoteAIResult = {
  title: string;
  tags: string[];
  people: string[];
};

function uniqLower(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const key = it.trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export async function analyzeNoteMock(rawText: string): Promise<NoteAIResult> {
  const text = rawText.trim();

  // Extract hashtags: #finance, #ideas, etc.
  const tagMatches = Array.from(text.matchAll(/#([a-zA-Z0-9_]+)/g)).map((m) => m[1]);
  const tags = uniqLower(tagMatches);

  // Extract mentions: @Sarah, @john_doe
  const peopleMatches = Array.from(text.matchAll(/@([a-zA-Z0-9_]+)/g)).map((m) => m[1]);
  const people = uniqLower(peopleMatches).map((p) => `@${p}`);

  // Title heuristic: first non-empty line, clipped
  const firstLine =
    text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? "Untitled";

  const title = firstLine.length > 60 ? firstLine.slice(0, 57) + "…" : firstLine;

  // Simulate async latency (feels like “processing”)
  await new Promise((r) => setTimeout(r, 350));

  return { title, tags, people };
}
