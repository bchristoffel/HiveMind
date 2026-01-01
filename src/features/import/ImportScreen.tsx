import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNotesContext } from "../../context/NotesContext";
import { ImportSource, normalizeImportedText } from "../../services/import/normalizeImport";

const SOURCES: { key: ImportSource; label: string }[] = [
  { key: "text", label: "Text" },
  { key: "message", label: "Message" },
  { key: "email", label: "Email" },
  { key: "note", label: "Note" },
  { key: "web", label: "Web" },
];

export default function ImportScreen({ navigation }: any) {
  const { addImportedNote } = useNotesContext();
  const [source, setSource] = useState<ImportSource>("text");
  const [raw, setRaw] = useState("");

  const canImport = useMemo(() => raw.trim().length > 0, [raw]);

  const onImport = () => {
    if (!canImport) return;

    const text = normalizeImportedText({ source, raw });
    const noteId = addImportedNote(text, source);

    setRaw("");
    Alert.alert("Imported", "Saved as a new note.");
    navigation.navigate("NoteDetail", { noteId });
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Import</Text>
      <Text style={styles.subtitle}>Paste text from messages, emails, notes, or web.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Source</Text>
        <View style={styles.row}>
          {SOURCES.map((s) => (
            <Pressable
              key={s.key}
              style={[styles.pill, source === s.key && styles.pillActive]}
              onPress={() => setSource(s.key)}
            >
              <Text style={styles.pillText}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.card, { flex: 1 }]}>
        <Text style={styles.cardTitle}>Content</Text>
        <TextInput
          value={raw}
          onChangeText={setRaw}
          placeholder="Paste here…"
          placeholderTextColor="#8a8a8a"
          multiline
          style={styles.input}
        />

        <Pressable style={[styles.button, !canImport && styles.buttonDisabled]} onPress={onImport} disabled={!canImport}>
          <Text style={styles.buttonText}>Import as Note</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 12, backgroundColor: "#121212" },
  title: { color: "white", fontSize: 22, fontWeight: "800", marginTop: 6 },
  subtitle: { color: "#bdbdbd", fontSize: 13, marginBottom: 6 },

  card: { backgroundColor: "#1E1E1E", borderRadius: 16, padding: 14, gap: 10 },
  cardTitle: { color: "white", fontSize: 14, fontWeight: "800" },

  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },

  pill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#2b2b2b",
  },
  pillActive: { backgroundColor: "#3B82F6" },
  pillText: { color: "white", fontSize: 12, fontWeight: "800" },

  input: {
    flex: 1,
    minHeight: 140,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#171717",
    color: "white",
    fontSize: 16,
    textAlignVertical: "top",
  },

  button: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#3B82F6",
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "800" },
});
