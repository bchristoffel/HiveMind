import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNotesContext } from "../../context/NotesContext";

export default function DashboardScreen() {
  const { addNote, notes, clearAll } = useNotesContext();
  const [text, setText] = useState("");

  const canSave = useMemo(() => text.trim().length > 0, [text]);

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today’s Context</Text>
        <Text style={styles.muted}>Notes captured: {notes.length}</Text>

        <Pressable style={styles.smallButton} onPress={clearAll}>
          <Text style={styles.smallButtonText}>Clear All</Text>
        </Pressable>
      </View>

      <View style={[styles.card, { flex: 1 }]}>
        <Text style={styles.cardTitle}>Braindump</Text>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type anything…"
          placeholderTextColor="#8a8a8a"
          multiline
          style={styles.input}
        />

        <Pressable
          style={[styles.button, !canSave && styles.buttonDisabled]}
          onPress={() => {
            addNote(text);
            setText("");
          }}
          disabled={!canSave}
        >
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: "#121212" },
  card: { backgroundColor: "#1E1E1E", borderRadius: 16, padding: 14, marginBottom: 12 },
  cardTitle: { color: "white", fontSize: 16, fontWeight: "700" },
  muted: { color: "#bdbdbd", marginTop: 6 },
  input: {
    minHeight: 140,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#171717",
    color: "white",
  },
  button: {
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "white", fontWeight: "700" },
  smallButton: {
    marginTop: 8,
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#2b2b2b",
  },
  smallButtonText: { color: "white" },
});
