import { api } from "@/shared/api/axios";
import type {
  AdminCalendarEntry,
  CreateAdminCalendarEntryBody,
  UpdateAdminCalendarEntryBody,
} from "../model/types";

export const adminCalendarApi = {
  list: (from: string, to: string) =>
    api
      .get<AdminCalendarEntry[]>("/api/admin/calendar/entries", {
        params: { from, to },
      })
      .then((res) => res.data),

  create: (body: CreateAdminCalendarEntryBody) =>
    api
      .post<AdminCalendarEntry>("/api/admin/calendar/entries", body)
      .then((res) => res.data),

  update: (id: number, body: UpdateAdminCalendarEntryBody) =>
    api
      .put<AdminCalendarEntry>(`/api/admin/calendar/entries/${id}`, body)
      .then((res) => res.data),

  delete: (id: number) =>
    api.delete<void>(`/api/admin/calendar/entries/${id}`).then((res) => res.data),
};
