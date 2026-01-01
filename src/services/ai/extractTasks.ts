import { TaskProposal } from "../../domain/taskProposals";

function makeId() {
  const c = globalThis.crypto as any;
  return c?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clean(line: string) {
  return line.replace(/\s+/g, " ").trim();
}

function inferPriority(text: string): "low" | "med" | "high" | undefined {
  const t = text.toLowerCase();
  if (t.includes("urgent") || t.includes("asap") || t.includes("today")) return "high";
  if (t.includes("soon") || t.includes("tomorrow")) return "med";
  return undefined;
}

export async function extractTaskProposalsMock(params: {
  rawText: string;
  sourceNoteId: string;
}): Promise<TaskProposal[]> {
  const { rawText, sourceNoteId } = params;

  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const proposals: TaskProposal[] = [];

  for (const l of lines) {
    const line = clean(l);

    // Checkbox tasks: - [ ] Do the thing
    const checkbox = line.match(/^[-*]\s*\[\s*\]\s*(.+)$/i);
    if (checkbox?.[1]) {
      const title = clean(checkbox[1]);
      if (title.length >= 3) {
        proposals.push({
          id: makeId(),
          title,
          priority: inferPriority(title),
          sourceNoteId,
          createdAt: Date.now(),
        });
      }
      continue;
    }

    // "TODO: ..." / "Task: ..."
    const todo = line.match(/^(todo:|task:)\s*(.+)$/i);
    if (todo?.[2]) {
      const title = clean(todo[2]);
      if (title.length >= 3) {
        proposals.push({
          id: makeId(),
          title,
          priority: inferPriority(title),
          sourceNoteId,
          createdAt: Date.now(),
        });
      }
      continue;
    }

    // Simple heuristic: imperative verb start (very lightweight)
    // e.g. "Email John by Friday", "Call mom", "Schedule dentist appointment"
    const imperativeStart = line.match(/^(email|call|schedule|send|submit|review|pay|book|follow up|message)\b/i);
    if (imperativeStart) {
      proposals.push({
        id: makeId(),
        title: line,
        priority: inferPriority(line),
        sourceNoteId,
        createdAt: Date.now(),
      });
      continue;
    }
  }

  // Deduplicate by title (case-insensitive)
  const seen = new Set<string>();
  const unique = proposals.filter((p) => {
    const key = p.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Simulate latency
  await new Promise((r) => setTimeout(r, 250));

  return unique.slice(0, 8); // cap
}
