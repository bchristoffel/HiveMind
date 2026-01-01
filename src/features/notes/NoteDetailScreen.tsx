import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNotesContext } from "../../context/NotesContext";
import dayjs from "dayjs";
import { pickImageAttachment } from "../../services/attachments/image";
import { playAudio, startVoiceRecording } from "../../services/attachments/audio";
import { NoteAttachment } from "../../domain/attachments/types";

export default function NoteDetailScreen({ route, navigation }: any) {
  const { noteId } = route.params ?? {};
  const {
    getNoteById,
    updateNoteText,
    deleteNote,
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
  } = useNotesContext();

  const note = useMemo(() => (noteId ? getNoteById(noteId) : undefined), [noteId, getNoteById]);
  const [draft, setDraft] = useState(note?.rawText ?? "");

  useEffect(() => {
    setDraft(note?.rawText ?? "");
  }, [note?.rawText]);

  const proposals = useMemo(() => (noteId ? getTaskProposalsForNote(noteId) : []), [noteId, getTaskProposalsForNote]);
  const processing = note ? isProcessing(note.id) : false;

  const linkedEvent = useMemo(() => (noteId ? getLinkedEventForNote(noteId) : null), [noteId, getLinkedEventForNote]);
  const contactMatches = useMemo(
    () => (noteId ? getContactMatchesForNote(noteId) : []),
    [noteId, getContactMatchesForNote]
  );

  const attachments = note?.attachments ?? [];

  // Audio playback
  const soundRef = useRef<any>(null);
  const [recordingHandle, setRecordingHandle] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);

  if (!note) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Note not found</Text>
        <Text style={styles.meta}>It may have been deleted.</Text>
      </View>
    );
  }

  const hasChanges = draft.trim() !== note.rawText.trim();

  const onSave = () => {
    if (!hasChanges) return;
    updateNoteText(note.id, draft);
    Alert.alert("Saved", "Your note was updated.");
  };

  const onDelete = () => {
    Alert.alert("Delete note?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteNote(note.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const onProcess = async () => {
    await processNote(note.id);
    Alert.alert("Processed", "Title/tags/people + task suggestions generated.");
  };

  const onAddPhoto = async () => {
    const att = await pickImageAttachment();
    if (!att) {
      Alert.alert("Photo not added", "Permission denied or canceled.");
      return;
    }
    addAttachmentToNote(note.id, att);
  };

  const onToggleRecord = async () => {
    if (isRecording && recordingHandle) {
      const att = await recordingHandle.stop();
      setRecordingHandle(null);
      setIsRecording(false);

      if (att) addAttachmentToNote(note.id, att);
      return;
    }

    const handle = await startVoiceRecording();
    if (!handle) {
      Alert.alert("Voice recording unavailable", "Recording works on iOS/Android devices. Web is disabled.");
      return;
    }
    setRecordingHandle(handle);
    setIsRecording(true);
  };

  const onPlayAudio = async (uri: string) => {
    // stop any prior
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }

    const s = await playAudio(uri);
    if (!s) {
      Alert.alert("Playback unavailable", "Audio playback is supported on device.");
      return;
    }
    soundRef.current = s;
  };

  const onRemoveAttachment = (att: NoteAttachment) => {
    Alert.alert("Remove attachment?", "This removes it from the note.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeAttachmentFromNote(note.id, att.id),
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      {/* HUD */}
      <View style={styles.hud}>
        <Text style={styles.hudTitle}>{note.title ?? "Smart Header"}</Text>

        <View style={styles.hudRow}>
          <Text style={styles.hudLine}>Status: {note.status}</Text>
          {processing ? <Text style={styles.processing}>Processing…</Text> : null}
        </View>

        <Text style={styles.hudLine}>Created: {new Date(note.createdAt).toLocaleString()}</Text>
        <Text style={styles.hudLine}>Updated: {new Date(note.updatedAt).toLocaleString()}</Text>

        <Text style={styles.hudLine}>
          Linked event:{" "}
          {linkedEvent
            ? `${dayjs(linkedEvent.startDate).format("h:mm A")}–${dayjs(linkedEvent.endDate).format("h:mm A")} • ${linkedEvent.title}`
            : note.linkedEventId
            ? `Event ID: ${note.linkedEventId}`
            : "—"}
        </Text>

        <Text style={styles.hudLine}>Tags: {note.tags.length ? note.tags.map((t) => `#${t}`).join(" ") : "—"}</Text>
        <Text style={styles.hudLine}>People: {note.people.length ? note.people.join(", ") : "—"}</Text>
        <Text style={styles.hudLine}>
          Contacts: {contactMatches.length ? contactMatches.map((c) => c.displayName).join(", ") : "—"}
        </Text>
      </View>

      {/* Capture Inputs */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Capture Inputs</Text>
        <View style={styles.row}>
          <Pressable style={styles.pillPrimary} onPress={onAddPhoto}>
            <Text style={styles.pillText}>Add Photo</Text>
          </Pressable>

          <Pressable style={[styles.pillPrimary, isRecording && { backgroundColor: "#F97316" }]} onPress={onToggleRecord}>
            <Text style={styles.pillText}>{isRecording ? "Stop Recording" : "Record Voice"}</Text>
          </Pressable>

          <Pressable
            style={styles.pillPrimary}
            onPress={() => navigation.navigate("Draw", { noteId: note.id })}
          >
            <Text style={styles.pillText}>Handwrite</Text>
          </Pressable>
        </View>
      </View>

      {/* Attachments */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Attachments</Text>
        {attachments.length === 0 ? (
          <Text style={styles.muted}>No attachments yet.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {attachments.map((att) => (
              <View key={att.id} style={styles.attachmentRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attachmentTitle}>{att.kind.toUpperCase()}</Text>
                  <Text style={styles.attachmentMeta}>
                    {att.kind === "image"
                      ? `${att.width ?? "?"}×${att.height ?? "?"}`
                      : att.kind === "audio"
                      ? `${Math.round((att.durationMs ?? 0) / 1000)}s`
                      : `${att.strokes?.length ?? 0} stroke(s)`}
                  </Text>
                </View>

                {att.kind === "image" && att.uri ? (
                  <Image source={{ uri: att.uri }} style={styles.thumb} />
                ) : null}

                {att.kind === "audio" && att.uri ? (
                  <Pressable style={styles.pill} onPress={() => onPlayAudio(att.uri!)}>
                    <Text style={styles.pillText}>Play</Text>
                  </Pressable>
                ) : null}

                <Pressable style={styles.pill} onPress={() => onRemoveAttachment(att)}>
                  <Text style={styles.pillText}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Task Suggestions */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Task Suggestions</Text>
          <Pressable
            style={[styles.pill, proposals.length === 0 && { opacity: 0.45 }]}
            disabled={proposals.length === 0}
            onPress={() => clearTaskProposals(note.id)}
          >
            <Text style={styles.pillText}>Clear</Text>
          </Pressable>
        </View>

        {proposals.length === 0 ? (
          <Text style={styles.muted}>
            No suggested tasks yet. Tap <Text style={{ fontWeight: "800" }}>Process</Text> to generate.
          </Text>
        ) : (
          <View style={{ gap: 10 }}>
            {proposals.map((p) => (
              <View key={p.id} style={styles.taskRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>{p.title}</Text>
                  <Text style={styles.taskMeta}>{p.priority ? `Priority: ${p.priority.toUpperCase()}` : "Priority: —"}</Text>
                </View>

                <View style={{ gap: 8 }}>
                  <Pressable
                    style={[styles.pill, styles.pillPrimary]}
                    onPress={async () => {
                      await acceptTaskProposal(note.id, p.id);
                      Alert.alert("Added", "Task was added to your Tasks tab.");
                    }}
                  >
                    <Text style={styles.pillText}>Accept</Text>
                  </Pressable>
                  <Pressable style={styles.pill} onPress={() => dismissTaskProposal(note.id, p.id)}>
                    <Text style={styles.pillText}>Dismiss</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Editor */}
      <View style={styles.editorCard}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          multiline
          style={styles.editor}
          placeholder="Edit your note…"
          placeholderTextColor="#8a8a8a"
        />
      </View>

      {/* Actions */}
      <View style={styles.row}>
        <Pressable style={[styles.button, !hasChanges && styles.buttonDisabled]} onPress={onSave} disabled={!hasChanges}>
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>

        <Pressable style={[styles.button, processing && styles.buttonDisabled]} onPress={onProcess} disabled={processing}>
          <Text style={styles.buttonText}>Process</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <Pressable style={[styles.button, styles.deleteButton]} onPress={onDelete}>
          <Text style={styles.buttonText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 12, backgroundColor: "#121212" },
  title: { color: "white", fontSize: 18, fontWeight: "800", marginTop: 8 },
  meta: { color: "#bdbdbd", marginTop: 6 },

  hud: { backgroundColor: "#1E1E1E", borderRadius: 16, padding: 12, gap: 6 },
  hudTitle: { color: "white", fontSize: 14, fontWeight: "800", marginBottom: 2 },
  hudRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hudLine: { color: "#bdbdbd", fontSize: 12 },
  processing: { color: "#F97316", fontSize: 12, fontWeight: "800" },

  card: { backgroundColor: "#1E1E1E", borderRadius: 16, padding: 12, gap: 10 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { color: "white", fontSize: 14, fontWeight: "800" },
  muted: { color: "#bdbdbd", fontSize: 12 },

  taskRow: {
    backgroundColor: "#171717",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  taskTitle: { color: "white", fontSize: 14, fontWeight: "700" },
  taskMeta: { color: "#9aa0a6", fontSize: 12, marginTop: 4 },

  attachmentRow: {
    backgroundColor: "#171717",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  attachmentTitle: { color: "white", fontSize: 13, fontWeight: "800" },
  attachmentMeta: { color: "#9aa0a6", fontSize: 12, marginTop: 4 },
  thumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: "#2b2b2b" },

  editorCard: { flex: 1, backgroundColor: "#1E1E1E", borderRadius: 16, padding: 12 },
  editor: { flex: 1, color: "white", fontSize: 16, lineHeight: 22, textAlignVertical: "top" },

  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },

  button: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center", backgroundColor: "#3B82F6" },
  deleteButton: { backgroundColor: "#2b2b2b" },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "700" },

  pill: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#2b2b2b", alignItems: "center" },
  pillPrimary: { borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: "#3B82F6" },
  pillText: { color: "white", fontSize: 12, fontWeight: "800" },
});
