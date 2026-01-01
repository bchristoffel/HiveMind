import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNotesContext } from "../../context/NotesContext";
import { useTasks } from "../../storage/useTasks";
import { getTopPriorities } from "../../services/prioritization/score";
import { getEventsForDay, getNextEventFrom } from "../../services/apple/calendar";
import dayjs from "dayjs";

export default function DashboardScreen({ navigation }: any) {
  const { addNote, clearAll, notes, processNote } = useNotesContext();
  const { tasks, hydrated: tasksHydrated, refresh: refreshTasks } = useTasks();

  const [text, setText] = useState("");
  const [nextMeeting, setNextMeeting] = useState<{ title: string; time: string } | null>(null);

  const canSave = useMemo(() => text.trim().length > 0, [text]);

  const latestDraft = useMemo(() => notes.find((n) => n.status === "draft"), [notes]);

  const priorities = useMemo(() => {
    return getTopPriorities({ tasks, notes, maxItems: 3 });
  }, [tasks, notes]);

  useEffect(() => {
    (async () => {
      try {
        const events = await getEventsForDay(new Date());
        const next = getNextEventFrom(events, Date.now());
        if (!next) {
          setNextMeeting(null);
          return;
        }
        setNextMeeting({
          title: next.title,
          time: `${dayjs(next.startDate).format("h:mm A")}–${dayjs(next.endDate).format("h:mm A")}`,
        });
      } catch {
        setNextMeeting(null);
      }
    })();
  }, []);

  const onSave = async () => {
    if (!canSave) return;
    const id = await addNote(text);
    setText("");
    if (id) navigation.navigate("NoteDetail", { noteId: id });
  };

  const onProcessLatest = async () => {
    if (!latestDraft) return;
    await processNote(latestDraft.id);
  };

  return (
    <View style={styles.screen}>
      {/* Briefing */}
      <View style={styles.card}>
        <View style={styles.briefingHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Today’s Briefing</Text>
            <Text style={styles.muted}>
              Notes: {notes.length} • Tasks: {tasks.length}
            </Text>
          </View>

          <Pressable style={styles.smallButton} onPress={refreshTasks}>
            <Text style={styles.smallButtonText}>{tasksHydrated ? "Refresh" : "Loading…"}</Text>
          </Pressable>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={styles.sectionTitle}>Next Meeting</Text>
          <Text style={styles.muted}>
            {nextMeeting ? `${nextMeeting.time} • ${nextMeeting.title}` : "No meeting detected (or permissions not granted)."}
          </Text>
        </View>

        <View style={{ gap: 10, marginTop: 6 }}>
          <Text style={styles.sectionTitle}>Top Priorities</Text>

          {priorities.length === 0 ? (
            <Text style={styles.muted}>Nothing urgent right now. Capture a braindump below.</Text>
          ) : (
            priorities.map((p) => (
              <Pressable
                key={`${p.kind}-${p.id}`}
                style={styles.priorityRow}
                onPress={() => {
                  if (p.kind === "note") navigation.navigate("NoteDetail", { noteId: p.id });
                  if (p.kind === "task") navigation.navigate("Tasks");
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.priorityTitle} numberOfLines={1}>
                    {p.title}
                  </Text>
                  <Text style={styles.priorityMeta}>{p.detail}</Text>
                </View>

                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{p.kind === "task" ? "TASK" : "NOTE"}</Text>
                </View>
              </Pressable>
            ))
          )}
        </View>

        <View style={styles.row}>
          <Pressable
            style={[styles.smallButton, !latestDraft && { opacity: 0.45 }]}
            onPress={onProcessLatest}
            disabled={!latestDraft}
          >
            <Text style={styles.smallButtonText}>Process Latest Draft</Text>
          </Pressable>

          <Pressable style={styles.smallButton} onPress={() => navigation.navigate("Import")}>
            <Text style={styles.smallButtonText}>Import</Text>
          </Pressable>

          <Pressable style={styles.smallButton} onPress={clearAll}>
            <Text style={styles.smallButtonText}>Clear Notes</Text>
          </Pressable>
        </View>
      </View>

      {/* Capture */}
      <View style={[styles.card, { flex: 1 }]}>
        <Text style={styles.cardTitle}>Braindump</Text>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder='Type anything… (e.g., "Upcoming Flight to Chicago")'
          placeholderTextColor="#8a8a8a"
          multiline
          style={styles.input}
        />

        <Pressable style={[styles.button, !canSave && styles.buttonDisabled]} onPress={onSave} disabled={!canSave}>
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 12, backgroundColor: "#121212" },

  card: { backgroundColor: "#1E1E1E", borderRadius: 16, padding: 14, gap: 10 },
  cardTitle: { color: "white", fontSize: 16, fontWeight: "800" },
  muted: { color: "#bdbdbd", fontSize: 13 },

  briefingHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  sectionTitle: { color: "#9aa0a6", fontSize: 12, fontWeight: "800" },

  priorityRow: {
    backgroundColor: "#171717",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  priorityTitle: { color: "white", fontSize: 14, fontWeight: "700" },
  priorityMeta: { color: "#9aa0a6", fontSize: 12, marginTop: 4 },

  badge: { backgroundColor: "#2b2b2b", borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  badgeText: { color: "white", fontSize: 11, fontWeight: "900" },

  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  smallButton: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    backgroundColor: "#2b2b2b",
  },
  smallButtonText: { color: "white", fontSize: 13, fontWeight: "700" },

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

  button: { borderRadius: 14, paddingVertical: 14, alignItems: "center", backgroundColor: "#3B82F6" },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "800" },
});
