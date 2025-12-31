import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useNotes } from "../storage/useNotes";

export default function TimelineScreen() {
  const { hydrated, notes } = useNotes();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Timeline</Text>
      <Text style={styles.subtitle}>A unified stream (Calendar + Tasks later).</Text>

      <ScrollView style={styles.list} contentContainerStyle={{ gap: 10, paddingBottom: 30 }}>
        {!hydrated ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : notes.length === 0 ? (
          <Text style={styles.muted}>No notes yet. Capture something on the Dashboard.</Text>
        ) : (
          notes.map((n) => (
            <View key={n.id} style={styles.card}>
              <Text style={styles.time}>{new Date(n.createdAt).toLocaleString()}</Text>
              <Text style={styles.text}>{n.rawText}</Text>
              <Text style={styles.meta}>Status: {n.status}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 8, backgroundColor: "#121212" },
  title: { color: "white", fontSize: 22, fontWeight: "800", marginTop: 6 },
  subtitle: { color: "#bdbdbd", fontSize: 13, marginBottom: 6 },
  list: { flex: 1 },
  muted: { color: "#bdbdbd", marginTop: 10 },
  card: { backgroundColor: "#1E1E1E", borderRadius: 16, padding: 12, gap: 6 },
  time: { color: "#9aa0a6", fontSize: 12 },
  text: { color: "white", fontSize: 15, lineHeight: 20 },
  meta: { color: "#bdbdbd", fontSize: 12 },
});
