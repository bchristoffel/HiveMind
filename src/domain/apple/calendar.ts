export type AppleCalendarEvent = {
  id: string;
  title: string;
  startDate: number; // ms
  endDate: number;   // ms
  location?: string;
  calendarId?: string;
};
