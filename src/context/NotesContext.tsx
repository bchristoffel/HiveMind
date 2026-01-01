import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Note } from "../domain/types";
import { loadNotes, saveNotes } from "../storage/notesStore";

type NotesContextType = {
  notes: Note[];
  hydrated: boolean;

  addNote: (text: string) => void;
  updateNoteText: (noteId: string, newText: string) => void;
  deleteNote: (noteId: string) => void;
  clearAll: () => void;

  getNoteById: (noteId: string) => Note | undefined;
};

const NotesContext = createContext<NotesContextType | null>(null);

function makeId() {
  const c = globalThis.crypto as any;
  return c?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load once
  useEffect(() => {
    (async () => {
      try {
        const loaded = await loadNotes();
        setNotes(Array.isArray(loaded) ? loaded : []);
      } catch (err) {
        console.warn("Failed to load notes:", err);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Persist on change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    (async () => {
      try {
        await saveNotes(notes);
      } catch (err) {
        console.warn("Failed to save notes:", err);
      }
    })();
  }, [notes, hydrated]);

  const addNote = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const now = Date.now();
    const newNote: Note = {
      id: makeId(),
      createdAt: now,
      updatedAt: now,
      rawText: trimmed,
      tags: [],
      people: [],
      status: "draft",
    };

    setNotes((prev) => [newNote, ...prev]);
  };

  const updateNoteText = (noteId: string, newText: string) => {
    const trimmed = newText.trim();
    if (!trimmed) return;

    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? {
              ...n,
              rawText: trimmed,
              updatedAt: Date.now(),
            }
          : n
      )
    );
  };

  const deleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const clearAll = () => setNotes([]);

  const getNoteById = useMemo(() => {
    const map = new Map(notes.map((n) => [n.id, n]));
    return (noteId: string) => map.get(noteId);
  }, [notes]);

  return (
    <NotesContext.Provider
      value={{
        notes,
        hydrated,
        addNote,
        updateNoteText,
        deleteNote,
        clearAll,
        getNoteById,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotesContext() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotesContext must be used within NotesProvider");
  return ctx;
}
