import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Note, NoteSource } from "../domain/types";
import { loadNotes, saveNotes } from "../storage/notesStore";
import { analyzeNoteMock } from "../services/ai/analyzeNote";
import { TaskProposal } from "../domain/taskProposals";
import { extractTaskProposalsMock } from "../services/ai/extractTasks";
import { createTask } from "../storage/tasksStore";
import { AppleCalendarEvent } from "../domain/apple/calendar";
import { AppleContactMatch } from "../domain/apple/contacts";
import { getCurrentEventFrom, getEventsForDay } from "../services/apple/calendar";
import { findBestContactByName } from "../services/apple/contacts";
import { NoteAttachment } from "../domain/attachments/types";

type NotesContextType = {
  notes: Note[];
  hydrated: boolean;

  addNote: (text: string) => Promise<string | null>;
  addImportedNote: (text: string, source: "text" | "email" | "message" | "note" | "web") => string;

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

  // Apple context/cache
  getLinkedEventForNote: (noteId: string) => AppleCalendarEvent | null;
  getContactMatchesForNote: (noteId: string) => AppleContactMatch[];

  // Attachments
  addAttachmentToNote: (noteId: string, attachment: NoteAttachment) => void;
  removeAttachmentFromNote: (noteId: string, attachmentId: string) => void;
};

const NotesContext = createContext<NotesContextType | null>(null);

function makeId() {
  const c = globalThis.crypto as any;
  return c?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mapImportSource(s: "text" | "email" | "message" | "note" | "web"): NoteSource {
  switch (s) {
    case "email":
      return "import_email";
    case "message":
      return "import_message";
    case "note":
      return "import_note";
    case "web":
      return "import_web";
    default:
      return "import_text";
  }
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  const [taskProposalsByNoteId, setTaskProposalsByNoteId] = useState<Record<string, TaskProposal[]>>(
    {}
  );

  const [linkedEventsByNoteId, setLinkedEventsByNoteId] = useState<Record<string, AppleCalendarEvent>>(
    {}
  );

  const [contactMatchesByNoteId, setContactMatchesByNoteId] = useState<Record<string, AppleContactMatch[]>>(
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

  const getNoteById = useMemo(() => {
    const map = new Map(notes.map((n) => [n.id, n]));
    return (noteId: string) => map.get(noteId);
  }, [notes]);

  const isProcessing = (noteId: string) => processingIds.includes(noteId);

  async function tryLinkCurrentMeeting(noteId: string) {
    try {
      const events = await getEventsForDay(new Date());
      const current = getCurrentEventFrom(events, Date.now());
      if (!current) return;

      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, linkedEventId: current.id } : n))
      );

      setLinkedEventsByNoteId((prev) => ({ ...prev, [noteId]: current }));
    } catch {
      // silent
    }
  }

  const addNote = async (text: string): Promise<string | null> => {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const now = Date.now();
    const id = makeId();

    const newNote: Note = {
      id,
      createdAt: now,
      updatedAt: now,
      rawText: trimmed,
      tags: [],
      people: [],
      status: "draft",
      source: "capture",
      attachments: [],
    };

    setNotes((prev) => [newNote, ...prev]);
    tryLinkCurrentMeeting(id);
    return id;
  };

  const addImportedNote = (text: string, source: "text" | "email" | "message" | "note" | "web"): string => {
    const trimmed = text.trim();
    const now = Date.now();
    const id = makeId();

    const newNote: Note = {
      id,
      createdAt: now,
      updatedAt: now,
      rawText: trimmed,
      tags: [],
      people: [],
      status: "draft",
      source: mapImportSource(source),
      attachments: [],
    };

    setNotes((prev) => [newNote, ...prev]);
    return id;
  };

  const updateNoteText = (noteId: string, newText: string) => {
    const trimmed = newText.trim();
    if (!trimmed) return;

    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, rawText: trimmed, updatedAt: Date.now(), status: "draft" } : n
      )
    );

    setTaskProposalsByNoteId((prev) => {
      if (!prev[noteId]) return prev;
      const next = { ...prev };
      delete next[noteId];
      return next;
    });

    setContactMatchesByNoteId((prev) => {
      if (!prev[noteId]) return prev;
      const next = { ...prev };
      delete next[noteId];
      return next;
    });
  };

  const addAttachmentToNote = (noteId: string, attachment: NoteAttachment) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== noteId) return n;
        const attachments = n.attachments ?? [];
        return {
          ...n,
          attachments: [attachment, ...attachments],
          updatedAt: Date.now(),
        };
      })
    );
  };

  const removeAttachmentFromNote = (noteId: string, attachmentId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== noteId) return n;
        const attachments = (n.attachments ?? []).filter((a) => a.id !== attachmentId);
        return { ...n, attachments, updatedAt: Date.now() };
      })
    );
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

    setLinkedEventsByNoteId((prev) => {
      if (!prev[noteId]) return prev;
      const next = { ...prev };
      delete next[noteId];
      return next;
    });

    setContactMatchesByNoteId((prev) => {
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
    setLinkedEventsByNoteId({});
    setContactMatchesByNoteId({});
  };

  const processNote = async (noteId: string) => {
    const note = getNoteById(noteId);
    if (!note) return;
    if (isProcessing(noteId)) return;

    setProcessingIds((prev) => [noteId, ...prev]);

    try {
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

      const proposals = await extractTaskProposalsMock({
        rawText: note.rawText,
        sourceNoteId: noteId,
      });

      setTaskProposalsByNoteId((prev) => ({ ...prev, [noteId]: proposals }));

      const people = result.people ?? [];
      if (people.length) {
        const matches: NoteAttachment[] = [];
        const contactMatches: AppleContactMatch[] = [];
        for (const p of people) {
          const m = await findBestContactByName(p);
          if (m) contactMatches.push(m);
        }
        if (contactMatches.length) {
          setContactMatchesByNoteId((prev) => ({ ...prev, [noteId]: contactMatches }));
        }
      }
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
    setTaskProposalsByNoteId((prev) => ({ ...prev, [noteId]: [] }));
  };

  const acceptTaskProposal = async (noteId: string, proposalId: string) => {
    const proposals = getTaskProposalsForNote(noteId);
    const proposal = proposals.find((p) => p.id === proposalId);
    if (!proposal) return;

    await createTask({
      title: proposal.title,
      notes: proposal.notes,
      dueAt: proposal.dueAt,
      sourceNoteId: proposal.sourceNoteId,
      priority: proposal.priority,
    });

    dismissTaskProposal(noteId, proposalId);
  };

  const getLinkedEventForNote = (noteId: string) => linkedEventsByNoteId[noteId] ?? null;
  const getContactMatchesForNote = (noteId: string) => contactMatchesByNoteId[noteId] ?? [];

  return (
    <NotesContext.Provider
      value={{
        notes,
        hydrated,
        addNote,
        addImportedNote,
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
        getLinkedEventForNote,
        getContactMatchesForNote,
        addAttachmentToNote,
        removeAttachmentFromNote,
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
