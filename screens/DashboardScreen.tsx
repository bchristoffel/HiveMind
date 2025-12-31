import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNotes } from "../storage/useNotes";

export default function DashboardScreen() {
  const { addNote, clearAll, count } = useNotes();
  const [text, setText] = useState("");

  const canSave = useMemo(() => text.trim().length > 0, [text]);

  const onSave = () => {
    if (!canSave) return;
    addNote(text);
    setText("");
  };

  return (
    <View style={styles.screen}>
      {/* Briefing (placeholder for now) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today’s Context</Text>
        <Text style={styles.muted}>Next meeting: (coming in Phase 2)</Text>
        <Text style={styles.muted}>Weather: (later)</Text>
        <Text style={styles.muted}>Notes captured: {count}</Text>

        <Pressable style={[styles.smallButton, { marginTop: 10 }]} onPress={clearAll}>
          <Text style={styles.smallButtonText}>Clear All Notes</Text>
        </Pressable>
      </View>

      {/* Capture */}
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
          onPress={onSave}
          disabled={!canSave}
        >
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: "#121212",
  },
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  cardTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  muted: {
    color: "#bdbdbd",
    fontSize: 13,
  },
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
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  smallButton: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    backgroundColor: "#2b2b2b",
    alignSelf: "flex-start",
  },
  smallButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
});
