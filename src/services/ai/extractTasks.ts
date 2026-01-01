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

type Intent =
  | "travel_flight"
  | "travel_general"
  | "meeting"
  | "finance"
  | "health"
  | "home"
  | "general";

function detectIntent(text: string): Intent {
  const t = text.toLowerCase();
  const flightWords = ["flight", "boarding pass", "gate", "tsa", "airport", "terminal", "layover", "ohare", "o'hare"];
  const travelWords = ["trip", "travel", "hotel", "reservation", "itinerary", "airbnb", "rental car", "uber", "lyft"];
  const meetingWords = ["meeting", "sync", "standup", "1:1", "one-on-one", "agenda", "minutes"];
  const financeWords = ["invoice", "bill", "budget", "payment", "tax", "bank", "rent", "insurance"];
  const healthWords = ["doctor", "dentist", "appointment", "prescription", "symptoms"];
  const homeWords = ["grocery", "laundry", "clean", "repair", "maintenance", "call plumber"];

  const hasAny = (arr: string[]) => arr.some((w) => t.includes(w));
  if (hasAny(flightWords)) return "travel_flight";
  if (hasAny(travelWords)) return "travel_general";
  if (hasAny(meetingWords)) return "meeting";
  if (hasAny(financeWords)) return "finance";
  if (hasAny(healthWords)) return "health";
  if (hasAny(homeWords)) return "home";
  return "general";
}

function templateTasks(intent: Intent, rawText: string): string[] {
  // Lightweight “likely checklist” templates (expand over time)
  switch (intent) {
    case "travel_flight":
      return [
        "Confirm flight time and terminal",
        "Check in online and add boarding pass to Wallet",
        "Review baggage policy and pack essentials",
        "Arrange transportation to the airport",
        "Plan arrival time (TSA / security buffer)",
        "Charge devices + pack charger",
        "Verify ID/passport is ready",
      ];

    case "travel_general":
      return [
        "Confirm reservation details (lodging / transport)",
        "Build a short packing list",
        "Check weather for destination",
        "Share itinerary with anyone involved",
        "Confirm transportation plan (airport/train/car)",
      ];

    case "meeting":
      return [
        "Write 3 bullet agenda items",
        "Gather links/docs needed for the meeting",
        "Capture action items during the meeting",
        "Send follow-up summary after the meeting",
      ];

    case "finance":
      return [
        "Identify what needs to be paid or reviewed",
        "Confirm due dates and amounts",
        "Schedule payment / set reminder",
        "File or record the transaction for reference",
      ];

    case "health":
      return [
        "Confirm appointment time/location",
        "Bring insurance card / ID",
        "Write down symptoms/questions to ask",
        "Pick up prescription / follow-up if needed",
      ];

    case "home":
      return [
        "List the supplies/tools needed",
        "Schedule a time to complete it",
        "Do the task",
        "Mark as done and note any follow-up",
      ];

    default:
      // If user wrote very little, still offer a gentle prompt
      if (rawText.trim().split(/\s+/).length <= 4) {
        return ["Add any details that would make this actionable (optional)"];
      }
      return [];
  }
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

  // 1) Explicit extraction pass
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

    // Imperative heuristic
    const imperativeStart = line.match(
      /^(email|call|schedule|send|submit|review|pay|book|follow up|message)\b/i
    );
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

  // 2) If explicit tasks are missing/low, infer checklist from intent
  const intent = detectIntent(rawText);
  const inferred = templateTasks(intent, rawText);

  // Only add inferred tasks if user didn’t already list many tasks
  if (proposals.length < 2 && inferred.length > 0) {
    for (const title of inferred) {
      proposals.push({
        id: makeId(),
        title,
        priority: inferPriority(title) ?? (intent === "travel_flight" ? "med" : undefined),
        sourceNoteId,
        createdAt: Date.now(),
      });
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
  await new Promise((r) => setTimeout(r, 200));

  return unique.slice(0, 10);
}
