import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Task } from "../../domain/tasks";
import { createTask, deleteTask, listTasks, setTaskDone } from "../../storage/tasksStore";

export default function TasksScreen() {
  const [hydrated, setHydrated] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");

  const openTasks = useMemo(() => tasks.filter((t) => t.status === "open"), [tasks]);
  const doneTasks = useMemo(() => tasks.filter((t) => t.status === "done"), [tasks]);

  const refresh = async () => {
    const t = await listTasks();
    setTasks(t);
    setHydrated(true);
  };

  useEffect(() => {
    refresh();
  }, []);

  const canAdd = newTitle.trim().length > 0;

  const onAdd = async () => {
    if (!canAdd) return;
    await createTask({ title: newTitle });
    setNewTitle("");
    await refresh();
  };

  const onToggleDone = async (taskId: string, done: boolean) => {
    await setTaskDone(taskId, done);
    await refresh();
  };

  const onDelete = (taskId: string) => {
    Alert.alert("Delete task?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTask(taskId);
          await refresh();
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Tasks</Text>
      <Text style={styles.subtitle}>Your reminders & to-dos (local-first).</Text>

      {/* Add */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add a task</Text>
        <TextInput
          value={newTitle}
          onChangeText={setNewTitle}
          placeholder="e.g., Email John by Friday"
          placeholderTextColor="#8a8a8a"
          style={styles.input}
        />
        <Pressable
          style={[styles.button, !canAdd && styles.buttonDisabled]}
          onPress={onAdd}
          disabled={!canAdd}
        >
          <Text style={styles.buttonText}>Add</Text>
        </Pressable>
      </View>

      {/* Lists */}
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 30 }}>
        {!hydrated ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Open ({openTasks.length})</Text>
              <View style={{ gap: 10 }}>
                {openTasks.length === 0 ? (
                  <Text style={styles.muted}>No open tasks.</Text>
                ) : (
                  openTasks.map((t) => (
                    <View key={t.id} style={styles.taskCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.taskTitle}>{t.title}</Text>
                        <Text style={styles.taskMeta}>
                          Created: {new Date(t.createdAt).toLocaleString()}
                        </Text>
                      </View>

                      <View style={styles.taskActions}>
                        <Pressable
                          style={[styles.pill, styles.pillPrimary]}
                          onPress={() => onToggleDone(t.id, true)}
                        >
                          <Text style={styles.pillText}>Done</Text>
                        </Pressable>
                        <Pressable style={[styles.pill]} onPress={() => onDelete(t.id)}>
                          <Text style={styles.pillText}>Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Done ({doneTasks.length})</Text>
              <View style={{ gap: 10 }}>
                {doneTasks.length === 0 ? (
                  <Text style={styles.muted}>Nothing completed yet.</Text>
                ) : (
                  doneTasks.map((t) => (
                    <View key={t.id} style={styles.taskCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.taskTitle, { opacity: 0.7 }]}>{t.title}</Text>
                        <Text style={styles.taskMeta}>
                          Completed:{" "}
                          {t.completedAt ? new Date(t.completedAt).toLocaleString() : "—"}
                        </Text>
                      </View>

                      <View style={styles.taskActions}>
                        <Pressable
                          style={[styles.pill, styles.pillPrimary]}
                          onPress={() => onToggleDone(t.id, false)}
                        >
                          <Text style={styles.pillText}>Reopen</Text>
                        </Pressable>
                        <Pressable style={[styles.pill]} onPress={() => onDelete(t.id)}>
                          <Text style={styles.pillText}>Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 10, backgroundColor: "#121212" },
  title: { color: "white", fontSize: 22, fontWeight: "800", marginTop: 6 },
  subtitle: { color: "#bdbdbd", fontSize: 13, marginBottom: 6 },
  muted: { color: "#bdbdbd", marginTop: 10 },

  card: { backgroundColor: "#1E1E1E", borderRadius: 16, padding: 14, gap: 10 },
  cardTitle: { color: "white", fontSize: 14, fontWeight: "800" },

  input: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#171717",
    color: "white",
    fontSize: 16,
  },

  button: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#3B82F6",
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "700" },

  section: { gap: 8 },
  sectionTitle: { color: "#9aa0a6", fontSize: 12, fontWeight: "700" },

  taskCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 12,
    gap: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  taskTitle: { color: "white", fontSize: 15, lineHeight: 20 },
  taskMeta: { color: "#9aa0a6", fontSize: 12, marginTop: 4 },

  taskActions: { gap: 8 },
  pill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#2b2b2b",
    alignItems: "center",
  },
  pillPrimary: { backgroundColor: "#3B82F6" },
  pillText: { color: "white", fontSize: 12, fontWeight: "800" },
});
