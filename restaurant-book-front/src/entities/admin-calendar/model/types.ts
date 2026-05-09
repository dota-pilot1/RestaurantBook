export type AdminCalendarEntryType = "NOTICE" | "HOLIDAY" | "EVENT" | "MEMO";

export type AdminCalendarEntry = {
  id: number;
  scheduleDate: string;
  type: AdminCalendarEntryType;
  title: string;
  timeText: string | null;
  content: string | null;
  createdBy: number;
  createdByName: string | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdminCalendarEntryBody = {
  scheduleDate: string;
  type: AdminCalendarEntryType;
  title: string;
  timeText?: string | null;
  content?: string | null;
};

export type UpdateAdminCalendarEntryBody = CreateAdminCalendarEntryBody;
