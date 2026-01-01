import { useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { useNotesContext } from "../../context/NotesContext";
import { DrawingStroke, NoteAttachment } from "../../domain/attachments/types";

function makeId() {
  const c = globalThis.crypto as any;
  return c?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function DrawScreen({ route, navigation }: any) {
  const { noteId } = route.params ?? {};
  const { addAttachmentToNote } = useNotesContext();

  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const currentStroke = useRef<DrawingStroke | null>(null);

  const pointsToString = (stroke: DrawingStroke) =>
    stroke.points.map((p) => `${p.x},${p.y}`).join(" ");

  const svgPolylines = useMemo(() => {
    return strokes.map((s, idx) => (
      <Polyline
        key={idx}
        points={pointsToString(s)}
        fill="none"
        stroke="white"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ));
  }, [strokes]);

  const startStroke = (x: number, y: number) => {
    currentStroke.current = { points: [{ x, y }] };
    setStrokes((prev) => [...prev, currentStroke.current as DrawingStroke]);
  };

  const moveStroke = (x: number, y: number) => {
    const s = currentStroke.current;
    if (!s) return;
    s.points.push({ x, y });
    // force re-render by replacing last stroke
    setStrokes((prev) => {
      const next = [...prev];
      next[next.length - 1] = { ...s, points: [...s.points] };
      return next;
    });
  };

  const endStroke = () => {
    currentStroke.current = null;
  };

  const onClear = () => setStrokes([]);

  const onSave = () => {
    if (!noteId) return;
    if (strokes.length === 0) {
      Alert.alert("Nothing to save", "Draw something first.");
      return;
    }

    const attachment: NoteAttachment = {
      id: makeId(),
      kind: "drawing",
      createdAt: Date.now(),
      strokes,
    };

    addAttachmentToNote(noteId, attachment);
    navigation.goBack();
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Handwrite</Text>
      <Text style={styles.subtitle}>Use stylus or mouse. Save attaches to your note.</Text>

      <View
        style={styles.canvas}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          const { locationX, locationY } = e.nativeEvent;
          startStroke(locationX, locationY);
        }}
        onResponderMove={(e) => {
          const { locationX, locationY } = e.nativeEvent;
          moveStroke(locationX, locationY);
        }}
        onResponderRelease={endStroke}
        onResponderTerminate={endStroke}
      >
        <Svg width="100%" height="100%">
          {svgPolylines}
        </Svg>
      </View>

      <View style={styles.row}>
        <Pressable style={[styles.button, styles.secondary]} onPress={onClear}>
          <Text style={styles.buttonText}>Clear</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={onSave}>
          <Text style={styles.buttonText}>Save to Note</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 10, backgroundColor: "#121212" },
  title: { color: "white", fontSize: 22, fontWeight: "800", marginTop: 6 },
  subtitle: { color: "#bdbdbd", fontSize: 13, marginBottom: 4 },
  canvas: { flex: 1, backgroundColor: "#1E1E1E", borderRadius: 16, overflow: "hidden" },
  row: { flexDirection: "row", gap: 10 },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#3B82F6",
  },
  secondary: { backgroundColor: "#2b2b2b" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "800" },
});
