import { Platform } from "react-native";
import { Audio } from "expo-av";
import { copyToAppStorage } from "./storage";
import { NoteAttachment } from "../../domain/attachments/types";

function makeId() {
  const c = globalThis.crypto as any;
  return c?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export type AudioRecorderHandle = {
  stop: () => Promise<NoteAttachment | null>;
};

export async function startVoiceRecording(): Promise<AudioRecorderHandle | null> {
  // Web recording support varies; keep it safe/clean:
  if (Platform.OS === "web") return null;

  const perm = await Audio.requestPermissionsAsync();
  if (perm.status !== "granted") return null;

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  await recording.startAsync();

  const stop = async (): Promise<NoteAttachment | null> => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) return null;

      const id = makeId();
      const storedUri = await copyToAppStorage({ sourceUri: uri, id, mimeType: "audio/m4a" });

      // duration is available after stop on many platforms:
      const status = await recording.getStatusAsync();
      const durationMs = (status as any)?.durationMillis as number | undefined;

      return {
        id,
        kind: "audio",
        createdAt: Date.now(),
        uri: storedUri,
        mimeType: "audio/m4a",
        durationMs,
      };
    } catch {
      return null;
    }
  };

  return { stop };
}

export async function playAudio(uri: string): Promise<Audio.Sound | null> {
  if (Platform.OS === "web") return null;
  try {
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
    return sound;
  } catch {
    return null;
  }
}
