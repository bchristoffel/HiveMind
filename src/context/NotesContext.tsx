import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Note } from "../domain/types";
import { loadNotes, saveNotes } from "../storage/notesStore";
import { analyzeNoteMock } from "../services/ai/analyzeNote";

type NotesContextType = {
  notes: Note[];
  hydrated: boolean;

  addNote: (text: string) => void;
  updateNoteText: (noteId: string, newText: string) => void;
  deleteNote: (noteId: string) => void;
  clearAll: () => void;

  getNoteById: (noteId: string) => Note | undefined;

  processNote: (noteId: string) => Promise<void>;
  isProcessing: (noteId: string) => boolean;
};

const NotesContext = createContext<NotesContextType | null>(null);

function makeId() {
  const c = globalThis.crypto as any;
  return c?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);

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
              // If user edits a processed note, treat as draft again (so it can be re-processed)
              status: "draft",
            }
          : n
      )
    );
  };

  const deleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    setProcessingIds((prev) => prev.filter((id) => id !== noteId));
  };

  const clearAll = () => {
    setNotes([]);
    setProcessingIds([]);
  };

  const getNoteById = useMemo(() => {
    const map = new Map(notes.map((n) => [n.id, n]));
    return (noteId: string) => map.get(noteId);
  }, [notes]);

  const isProcessing = (noteId: string) => processingIds.includes(noteId);

  const processNote = async (noteId: string) => {
    const note = getNoteById(noteId);
    if (!note) return;
    if (isProcessing(noteId)) return;

    setProcessingIds((prev) => [noteId, ...prev]);

    try {
      // MOCK for now. Later: replace analyzeNoteMock(...) with OpenAI call.
      const result = await analyzeNoteMock(note.rawText);

      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? {
                ...n,
                title: result.title,
                tags: result.tags,
                people: result.people,
                status: "processed",
                updatedAt: Date.now(),
              }
            : n
        )
      );
    } catch (err) {
      console.warn("Failed to process note:", err);
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== noteId));
    }
  };

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
        processNote,
        isProcessing,
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
