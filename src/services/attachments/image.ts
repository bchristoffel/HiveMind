import * as ImagePicker from "expo-image-picker";
import { copyToAppStorage } from "./storage";
import { NoteAttachment } from "../../domain/attachments/types";

function makeId() {
  const c = globalThis.crypto as any;
  return c?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function pickImageAttachment(): Promise<NoteAttachment | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") return null;

  // Let user choose camera or library via built-in UI:
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.9,
  });

  if (res.canceled) return null;

  const asset = res.assets?.[0];
  if (!asset?.uri) return null;

  const id = makeId();
  const storedUri = await copyToAppStorage({
    sourceUri: asset.uri,
    id,
    mimeType: asset.mimeType,
  });

  return {
    id,
    kind: "image",
    createdAt: Date.now(),
    uri: storedUri,
    mimeType: asset.mimeType ?? "image/*",
    width: asset.width,
    height: asset.height,
  };
}
