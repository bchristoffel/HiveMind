import { Platform } from "react-native";
import * as Contacts from "expo-contacts";
import { AppleContactMatch } from "../../domain/apple/contacts";

export async function ensureContactsPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status } = await Contacts.requestPermissionsAsync();
  return status === "granted";
}

function normalizeName(s: string) {
  return s.trim().toLowerCase();
}

function scoreContact(query: string, contact: Contacts.Contact): number {
  const q = normalizeName(query);
  const name = normalizeName(contact.name ?? "");
  const first = normalizeName(contact.firstName ?? "");
  const last = normalizeName(contact.lastName ?? "");

  // Simple scoring
  let score = 0;
  if (!q) return 0;

  if (name === q) score += 100;
  if (name.includes(q)) score += 60;
  if (first === q) score += 70;
  if (last === q) score += 50;
  if (`${first} ${last}`.trim() === q) score += 90;

  return score;
}

export async function findBestContactByName(nameOrHandle: string): Promise<AppleContactMatch | null> {
  if (Platform.OS === "web") return null;

  const ok = await ensureContactsPermission();
  if (!ok) return null;

  const query = nameOrHandle.replace(/^@/, "").trim();
  if (!query) return null;

  // Broad fetch (small projects are fine). Later: smarter search.
  const res = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
    pageSize: 50,
    pageOffset: 0,
  });

  if (!res?.data?.length) return null;

  let best: Contacts.Contact | null = null;
  let bestScore = 0;

  for (const c of res.data) {
    const s = scoreContact(query, c);
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }

  if (!best || bestScore < 50) return null;

  const emails = (best.emails ?? []).map((e) => e.email).filter(Boolean) as string[];
  const phones = (best.phoneNumbers ?? []).map((p) => p.number).filter(Boolean) as string[];

  return {
    id: String(best.id),
    displayName: best.name ?? query,
    emails,
    phones,
  };
}
