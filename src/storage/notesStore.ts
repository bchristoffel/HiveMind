import AsyncStorage from "@react-native-async-storage/async-storage";
import { Note } from "../domain/types";

const STORAGE_KEY = "hivemind.notes.v1";

export async function loadNotes(): Promise<Note[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveNotes(notes: Note[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}
