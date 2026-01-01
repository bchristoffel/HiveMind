import { Platform } from "react-native";
import * as Calendar from "expo-calendar";
import { AppleCalendarEvent } from "../../domain/apple/calendar";

function toMs(d: Date | string | number): number {
  if (typeof d === "number") return d;
  if (typeof d === "string") return new Date(d).getTime();
  return d.getTime();
}

export async function ensureCalendarPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === "granted";
}

async function getPrimaryCalendarId(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const primary = calendars.find((c) => (c as any).isPrimary) ?? calendars[0];
  return primary?.id ?? null;
}

export async function getEventsForDay(day: Date): Promise<AppleCalendarEvent[]> {
  if (Platform.OS === "web") return [];

  const ok = await ensureCalendarPermission();
  if (!ok) return [];

  const calendarId = await getPrimaryCalendarId();
  if (!calendarId) return [];

  const start = new Date(day);
  start.setHours(0, 0, 0, 0);

  const end = new Date(day);
  end.setHours(23, 59, 59, 999);

  const events = await Calendar.getEventsAsync([calendarId], start, end);

  return events
    .filter((e) => e.startDate && e.endDate)
    .map((e) => ({
      id: String(e.id),
      title: e.title ?? "Untitled event",
      startDate: toMs(e.startDate as any),
      endDate: toMs(e.endDate as any),
      location: e.location ?? undefined,
      calendarId,
    }))
    .sort((a, b) => a.startDate - b.startDate);
}

export function getNextEventFrom(events: AppleCalendarEvent[], nowMs = Date.now()): AppleCalendarEvent | null {
  return events.find((e) => e.endDate > nowMs) ?? null;
}

export function getCurrentEventFrom(events: AppleCalendarEvent[], nowMs = Date.now()): AppleCalendarEvent | null {
  return events.find((e) => e.startDate <= nowMs && nowMs <= e.endDate) ?? null;
}
