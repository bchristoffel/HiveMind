import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNotesContext } from "../../context/NotesContext";
import dayjs from "dayjs";

type Section = {
  key: string;
  title: string;
  notes: {
    id: string;
    createdAt: number;
    updatedAt: number;
    rawText: string;
    status: string;
  }[];
};

function makeSections(notes: any[]): Section[] {
  // Notes assumed newest-first; if not, sort them
  const sorted = [...notes].sort((a, b) => b.createdAt - a.createdAt);

  const now = dayjs();
  const todayKey = now.format("YYYY-MM-DD");
  const yesterdayKey = now.subtract(1, "day").format("YYYY-MM-DD");

  const buckets = new Map<string, any[]>();

  for (const n of sorted) {
    const key = dayjs(n.createdAt).format("YYYY-MM-DD");
    const arr = buckets.get(key) ?? [];
    arr.push(n);
    buckets.set(key, arr);
  }

  const keys = Array.from(buckets.keys()).sort((a, b) => (a < b ? 1 : -1)); // desc

  return keys.map((k) => {
    let title = dayjs(k).format("MMM D, YYYY");
    if (k === todayKey) title = "Today";
    if (k === yesterdayKey) title = "Yesterday";

    return { key: k, title, notes: buckets.get(k) ?? [] };
  });
}

export default function TimelineScreen({ navigation }: any) {
  const { notes, hydrated } = useNotesContext();

  const sections = makeSections(notes);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Timeline</Text>
      <Text style={styles.subtitle}>A unified stream (Calendar + Tasks soon).</Text>

      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 30 }}>
        {!hydrated ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : notes.length === 0 ? (
          <Text style={styles.muted}>No notes yet. Capture something on the Dashboard.</Text>
        ) : (
          sections.map((section) => (
            <View key={section.key} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>

              <View style={styles.sectionStack}>
                {section.notes.map((note) => {
                  const time = dayjs(note.createdAt).format("h:mm A");
                  const wasEdited = note.updatedAt !== note.createdAt;

                  return (
                    <Pressable
                      key={note.id}
                      onPress={() => navigation.navigate("NoteDetail", { noteId: note.id })}
                      style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
                    >
                      <View style={styles.cardHeader}>
                        <Text style={styles.time}>{time}</Text>
                        {wasEdited ? <Text style={styles.edited}>Updated</Text> : null}
                      </View>

                      <Text style={styles.text} numberOfLines={4}>
                        {note.rawText}
                      </Text>

                      <Text style={styles.meta}>Status: {note.status}</Text>
                    </Pressable>
                  );
                })}
              </View>
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

  section: { marginBottom: 14 },
  sectionTitle: { color: "#9aa0a6", fontSize: 12, fontWeight: "700", marginBottom: 8 },
  sectionStack: { gap: 10 },

  card: { backgroundColor: "#1E1E1E", borderRadius: 16, padding: 12, gap: 8 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  time: { color: "#9aa0a6", fontSize: 12 },
  edited: { color: "#10B981", fontSize: 12, fontWeight: "700" },

  text: { color: "white", fontSize: 15, lineHeight: 20 },
  meta: { color: "#bdbdbd", fontSize: 12 },
});
