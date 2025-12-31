import { useCallback, useEffect, useMemo, useState } from "react";
import { Note } from "../domain/types";
import { loadNotes, saveNotes } from "./notesStore";

export function useNotes() {
  const [hydrated, setHydrated] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    (async () => {
      const loaded = await loadNotes();
      setNotes(loaded);
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // fire-and-forget persistence
    saveNotes(notes).catch((e) => console.log("Failed to save notes:", e));
  }, [notes, hydrated]);

  const addNote = useCallback((rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    const now = Date.now();
    const newNote: Note = {
      id: globalThis.crypto?.randomUUID?.() ?? `${now}-${Math.random().toString(16).slice(2)}`,
      createdAt: now,
      updatedAt: now,
      rawText: trimmed,
      tags: [],
      people: [],
      status: "draft",
    };

    setNotes((prev) => [newNote, ...prev]);
  }, []);

  const clearAll = useCallback(() => setNotes([]), []);

  const count = useMemo(() => notes.length, [notes]);

  return { hydrated, notes, addNote, clearAll, count };
}
