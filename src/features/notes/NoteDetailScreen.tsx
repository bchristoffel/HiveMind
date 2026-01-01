import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNotesContext } from "../../context/NotesContext";

export default function NoteDetailScreen({ route, navigation }: any) {
  const { noteId } = route.params ?? {};
  const { getNoteById, updateNoteText, deleteNote, processNote, isProcessing } = useNotesContext();

  const note = useMemo(() => (noteId ? getNoteById(noteId) : undefined), [noteId, getNoteById]);
  const [draft, setDraft] = useState(note?.rawText ?? "");

  useEffect(() => {
    setDraft(note?.rawText ?? "");
  }, [note?.rawText]);

  if (!note) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Note not found</Text>
        <Text style={styles.meta}>It may have been deleted.</Text>
      </View>
    );
  }

  const hasChanges = draft.trim() !== note.rawText.trim();
  const processing = isProcessing(note.id);

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
    Alert.alert("Processed", "Title/tags/people have been extracted (mock).");
  };

  return (
    <View style={styles.screen}>
      {/* Smart Header (HUD) */}
      <View style={styles.hud}>
        <Text style={styles.hudTitle}>{note.title ?? "Smart Header"}</Text>

        <View style={styles.hudRow}>
          <Text style={styles.hudLine}>Status: {note.status}</Text>
          {processing ? <Text style={styles.processing}>Processing…</Text> : null}
        </View>

        <Text style={styles.hudLine}>Created: {new Date(note.createdAt).toLocaleString()}</Text>
        <Text style={styles.hudLine}>Updated: {new Date(note.updatedAt).toLocaleString()}</Text>
        <Text style={styles.hudLine}>Linked event: {note.linkedEventId ?? "—"}</Text>

        <Text style={styles.hudLine}>
          Tags: {note.tags.length ? note.tags.map((t) => `#${t}`).join(" ") : "—"}
        </Text>
        <Text style={styles.hudLine}>
          People: {note.people.length ? note.people.join(", ") : "—"}
        </Text>
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
        <Pressable
          style={[styles.button, !hasChanges && styles.buttonDisabled]}
          onPress={onSave}
          disabled={!hasChanges}
        >
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>

        <Pressable
          style={[styles.button, processing && styles.buttonDisabled]}
          onPress={onProcess}
          disabled={processing}
        >
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

  editorCard: { flex: 1, backgroundColor: "#1E1E1E", borderRadius: 16, padding: 12 },
  editor: {
    flex: 1,
    color: "white",
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: "top",
  },

  row: { flexDirection: "row", gap: 10 },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#3B82F6",
  },
  deleteButton: { backgroundColor: "#2b2b2b" },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "700" },
});
