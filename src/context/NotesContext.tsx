import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Note } from "../domain/types";
import { loadNotes, saveNotes } from "../storage/notesStore";
import { analyzeNoteMock } from "../services/ai/analyzeNote";
import { TaskProposal } from "../domain/taskProposals";
import { extractTaskProposalsMock } from "../services/ai/extractTasks";
import { createTask } from "../storage/tasksStore";

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

  // Task proposals
  getTaskProposalsForNote: (noteId: string) => TaskProposal[];
  acceptTaskProposal: (noteId: string, proposalId: string) => Promise<void>;
  dismissTaskProposal: (noteId: string, proposalId: string) => void;
  clearTaskProposals: (noteId: string) => void;
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

  // proposals are temporary and local (Stage 4/Sync can persist them)
  const [taskProposalsByNoteId, setTaskProposalsByNoteId] = useState<Record<string, TaskProposal[]>>(
    {}
  );

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
              status: "draft",
            }
          : n
      )
    );

    // If user edits note, clear old task proposals (so we don’t suggest stale actions)
    setTaskProposalsByNoteId((prev) => {
      if (!prev[noteId]) return prev;
      const next = { ...prev };
      delete next[noteId];
      return next;
    });
  };

  const deleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    setProcessingIds((prev) => prev.filter((id) => id !== noteId));
    setTaskProposalsByNoteId((prev) => {
      if (!prev[noteId]) return prev;
      const next = { ...prev };
      delete next[noteId];
      return next;
    });
  };

  const clearAll = () => {
    setNotes([]);
    setProcessingIds([]);
    setTaskProposalsByNoteId({});
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
      // 1) “AI” analysis (mock) for title/tags/people
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

      // 2) Task proposals (mock extraction)
      const proposals = await extractTaskProposalsMock({
        rawText: note.rawText,
        sourceNoteId: noteId,
      });

      setTaskProposalsByNoteId((prev) => ({
        ...prev,
        [noteId]: proposals,
      }));
    } catch (err) {
      console.warn("Failed to process note:", err);
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== noteId));
    }
  };

  const getTaskProposalsForNote = (noteId: string) => taskProposalsByNoteId[noteId] ?? [];

  const dismissTaskProposal = (noteId: string, proposalId: string) => {
    setTaskProposalsByNoteId((prev) => {
      const current = prev[noteId] ?? [];
      const nextForNote = current.filter((p) => p.id !== proposalId);
      return { ...prev, [noteId]: nextForNote };
    });
  };

  const clearTaskProposals = (noteId: string) => {
    setTaskProposalsByNoteId((prev) => {
      if (!prev[noteId]) return prev;
      return { ...prev, [noteId]: [] };
    });
  };

  const acceptTaskProposal = async (noteId: string, proposalId: string) => {
    const proposals = getTaskProposalsForNote(noteId);
    const proposal = proposals.find((p) => p.id === proposalId);
    if (!proposal) return;

    // Create real task in SQLite
    await createTask({
      title: proposal.title,
      notes: proposal.notes,
      dueAt: proposal.dueAt,
      sourceNoteId: proposal.sourceNoteId,
      priority: proposal.priority,
    });

    // Remove proposal after acceptance
    dismissTaskProposal(noteId, proposalId);
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
        getTaskProposalsForNote,
        acceptTaskProposal,
        dismissTaskProposal,
        clearTaskProposals,
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
