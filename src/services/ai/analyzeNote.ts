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

  const flightWords = ["flight", "boarding pass", "gate", "tsa", "airport", "terminal", "layover", "o'hare", "ohare"];
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

function inferTagsFromIntent(intent: Intent): string[] {
  switch (intent) {
    case "travel_flight":
    case "travel_general":
      return ["travel"];
    case "meeting":
      return ["work"];
    case "finance":
      return ["finance"];
    case "health":
      return ["health"];
    case "home":
      return ["home"];
    default:
      return [];
  }
}

function normalizeAirport(cityOrAirport: string): string | null {
  // Light heuristic mapping (we can expand later)
  const t = cityOrAirport.toLowerCase();

  if (t.includes("chicago") || t.includes("ohare") || t.includes("o'hare")) return "O’Hare";
  if (t.includes("new york") || t.includes("jfk")) return "JFK";
  if (t.includes("los angeles") || t.includes("lax")) return "LAX";
  if (t.includes("san francisco") || t.includes("sfo")) return "SFO";
  if (t.includes("seattle") || t.includes("sea")) return "SEA";
  return null;
}

function smartTitle(text: string, intent: Intent): string {
  const trimmed = text.trim();
  const firstLine =
    trimmed
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? "Untitled";

  // Flight title improvement:
  // "Upcoming Flight to Chicago" -> "Flight to O’Hare" (if we can map)
  if (intent === "travel_flight") {
    const m = firstLine.match(/flight\s+(to|for)\s+(.+)$/i) || firstLine.match(/to\s+([a-zA-Z'\s]+)$/i);
    const destRaw = m?.[2] ?? m?.[1] ?? firstLine;
    const airport = normalizeAirport(destRaw);
    if (airport) return `Flight to ${airport}`;
    // fallback if no airport match
    return firstLine.toLowerCase().includes("flight") ? firstLine.replace(/upcoming\s+/i, "").trim() : `Flight: ${firstLine}`;
  }

  // Meeting title improvement
  if (intent === "meeting") {
    if (/standup/i.test(firstLine)) return "Team Standup";
    if (/1:1|one[-\s]?on[-\s]?one/i.test(firstLine)) return "1:1";
    return firstLine.length > 60 ? firstLine.slice(0, 57) + "…" : firstLine;
  }

  // Default: keep first line short
  return firstLine.length > 60 ? firstLine.slice(0, 57) + "…" : firstLine;
}

export async function analyzeNoteMock(rawText: string): Promise<NoteAIResult> {
  const text = rawText.trim();

  // Extract hashtags: #finance, #ideas, etc.
  const tagMatches = Array.from(text.matchAll(/#([a-zA-Z0-9_]+)/g)).map((m) => m[1]);
  const explicitTags = uniqLower(tagMatches);

  // Extract mentions: @Sarah, @john_doe
  const peopleMatches = Array.from(text.matchAll(/@([a-zA-Z0-9_]+)/g)).map((m) => m[1]);
  const people = uniqLower(peopleMatches).map((p) => `@${p}`);

  const intent = detectIntent(text);
  const inferredTags = inferTagsFromIntent(intent);

  // Combine tags (explicit wins + inferred fills gaps)
  const tags = uniqLower([...explicitTags, ...inferredTags]);

  const title = smartTitle(text, intent);

  // Simulate async latency
  await new Promise((r) => setTimeout(r, 250));

  return { title, tags, people };
}
