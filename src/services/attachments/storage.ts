import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";

const ATT_DIR = `${FileSystem.documentDirectory ?? ""}hivemind_attachments`;

export async function ensureAttachmentsDir(): Promise<void> {
  if (Platform.OS === "web") return;
  if (!FileSystem.documentDirectory) return;

  const info = await FileSystem.getInfoAsync(ATT_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(ATT_DIR, { intermediates: true });
  }
}

function extFromMime(mime?: string) {
  if (!mime) return "";
  if (mime.includes("jpeg")) return ".jpg";
  if (mime.includes("jpg")) return ".jpg";
  if (mime.includes("png")) return ".png";
  if (mime.includes("heic")) return ".heic";
  if (mime.includes("m4a")) return ".m4a";
  if (mime.includes("mp4")) return ".mp4";
  if (mime.includes("wav")) return ".wav";
  return "";
}

export async function copyToAppStorage(params: {
  sourceUri: string;
  id: string;
  mimeType?: string;
}): Promise<string> {
  const { sourceUri, id, mimeType } = params;

  // Web: keep URI as-is (FileSystem copy isn’t meaningful)
  if (Platform.OS === "web") return sourceUri;

  await ensureAttachmentsDir();
  const ext = extFromMime(mimeType);
  const dest = `${ATT_DIR}/${id}${ext}`;

  // Some pickers return content:// — FileSystem can still copy in Expo env usually
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}
