import { createContext, useContext, useEffect, useState } from "react";
import { Note } from "../../domain/types";
import { loadNotes, saveNotes } from "../../storage/notesStore";

type NotesContextType = {
  notes: Note[];
  addNote: (text: string) => void;
  clearAll: () => void;
  hydrated: boolean;
};

const NotesContext = createContext<NotesContextType | null>(null);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load notes on app start
  useEffect(() => {
    (async () => {
      try {
        const stored = await loadNotes();
        setNotes(stored);
      } catch (err) {
        console.warn("Failed to load notes:", err);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Persist whenever notes change
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
      id: globalThis.crypto?.randomUUID?.() ?? `${now}-${Math.random()}`,
      createdAt: now,
      updatedAt: now,
      rawText: trimmed,
      tags: [],
      people: [],
      status: "draft",
    };

    setNotes((prev) => [newNote, ...prev]);
  };

  const clearAll = () => setNotes([]);

  return (
    <NotesContext.Provider
      value={{
        notes,
        addNote,
        clearAll,
        hydrated,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotesContext() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotesContext must be used within NotesProvider");
  }
  return context;
}
