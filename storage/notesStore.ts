import AsyncStorage from "@react-native-async-storage/async-storage";
import { Note } from "../domain/types";

const STORAGE_KEY = "hivemind.notes.v2";

function safeParseNotes(raw: string | null): Note[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // very light validation
    return parsed.filter((n) => n && typeof n.id === "string" && typeof n.rawText === "string");
  } catch {
    return [];
  }
}

export async function loadNotes(): Promise<Note[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const notes = safeParseNotes(raw);
  // newest first
  return notes.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveNotes(notes: Note[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}
