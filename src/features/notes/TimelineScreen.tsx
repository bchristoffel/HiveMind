import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import dayjs from "dayjs";
import { useMemo } from "react";
import { useNotesContext } from "../../context/NotesContext";
import { useTasks } from "../../storage/useTasks";
import { buildTimelineStream } from "../../services/timeline/buildStream";
import { TimelineItem } from "../../domain/timeline";

type Section = {
  key: string;
  title: string;
  items: TimelineItem[];
};

function makeSections(items: TimelineItem[]): Section[] {
  const now = dayjs();
  const todayKey = now.format("YYYY-MM-DD");
  const yesterdayKey = now.subtract(1, "day").format("YYYY-MM-DD");

  const buckets = new Map<string, TimelineItem[]>();

  for (const it of items) {
    const key = dayjs(it.ts).format("YYYY-MM-DD");
    const arr = buckets.get(key) ?? [];
    arr.push(it);
    buckets.set(key, arr);
  }

  const keys = Array.from(buckets.keys()).sort((a, b) => (a < b ? 1 : -1)); // desc

  return keys.map((k) => {
    let title = dayjs(k).format("MMM D, YYYY");
    if (k === todayKey) title = "Today";
    if (k === yesterdayKey) title = "Yesterday";

    return { key: k, title, items: buckets.get(k) ?? [] };
  });
}

function kindLabel(kind: TimelineItem["kind"]) {
  switch (kind) {
    case "note":
      return "NOTE";
    case "task_created":
      return "TASK";
    case "task_completed":
      return "DONE";
    default:
      return "ITEM";
  }
}

function kindColor(kind: TimelineItem["kind"]) {
  // We aren’t setting fancy colors, just keeping simple with subtle differentiation
  switch (kind) {
    case "note":
      return "#2b2b2b";
    case "task_created":
      return "#3B82F6";
    case "task_completed":
      return "#10B981";
    default:
      return "#2b2b2b";
  }
}

export default function TimelineScreen({ navigation }: any) {
  const { notes, hydrated: notesHydrated } = useNotesContext();
  const { tasks, hydrated: tasksHydrated } = useTasks();

  const stream = useMemo(() => buildTimelineStream({ notes, tasks }), [notes, tasks]);
  const sections = useMemo(() => makeSections(stream), [stream]);

  const hydrated = notesHydrated && tasksHydrated;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Timeline</Text>
      <Text style={styles.subtitle}>A unified stream (Notes + Tasks).</Text>

      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 30 }}>
        {!hydrated ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : stream.length === 0 ? (
          <Text style={styles.muted}>Nothing here yet. Add a note or task.</Text>
        ) : (
          sections.map((section) => (
            <View key={section.key} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>

              <View style={styles.sectionStack}>
                {section.items.map((it) => {
                  const time = dayjs(it.ts).format("h:mm A");

                  return (
                    <Pressable
                      key={it.id}
                      onPress={() => {
                        if (it.kind === "note" && it.noteId) {
                          navigation.navigate("NoteDetail", { noteId: it.noteId });
                          return;
                        }
                        // For tasks, send user to Tasks tab (where they can manage)
                        navigation.navigate("Tasks");
                      }}
                      style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
                    >
                      <View style={styles.cardHeader}>
                        <Text style={styles.time}>{time}</Text>

                        <View style={[styles.badge, { backgroundColor: kindColor(it.kind) }]}>
                          <Text style={styles.badgeText}>{kindLabel(it.kind)}</Text>
                        </View>
                      </View>

                      <Text style={styles.itemTitle} numberOfLines={2}>
                        {it.title}
                      </Text>

                      {it.subtitle ? (
                        <Text style={styles.text} numberOfLines={2}>
                          {it.subtitle}
                        </Text>
                      ) : null}

                      {it.kind !== "note" && it.task?.sourceNoteId ? (
                        <Text style={styles.meta} numberOfLines={1}>
                          Linked to a note
                        </Text>
                      ) : (
                        <Text style={styles.meta} numberOfLines={1}>
                          {it.kind === "note" ? `Status: ${it.note?.status ?? "—"}` : `Status: ${it.task?.status ?? "—"}`}
                        </Text>
                      )}
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

  badge: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  badgeText: { color: "white", fontSize: 11, fontWeight: "900" },

  itemTitle: { color: "white", fontSize: 15, fontWeight: "800", lineHeight: 20 },
  text: { color: "#bdbdbd", fontSize: 13, lineHeight: 18 },
  meta: { color: "#9aa0a6", fontSize: 12 },
});
