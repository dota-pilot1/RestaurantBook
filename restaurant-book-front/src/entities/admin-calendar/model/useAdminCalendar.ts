"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminCalendarApi } from "../api/adminCalendarApi";
import type {
  CreateAdminCalendarEntryBody,
  UpdateAdminCalendarEntryBody,
} from "./types";

const ROOT_KEY = ["admin-calendar"] as const;

export function useAdminCalendarEntries(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: [...ROOT_KEY, "range", from, to],
    queryFn: () => adminCalendarApi.list(from, to),
    enabled: enabled && Boolean(from) && Boolean(to),
    staleTime: 30_000,
  });
}

export function useCreateAdminCalendarEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAdminCalendarEntryBody) => adminCalendarApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROOT_KEY }),
  });
}

export function useUpdateAdminCalendarEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateAdminCalendarEntryBody }) =>
      adminCalendarApi.update(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROOT_KEY }),
  });
}

export function useDeleteAdminCalendarEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminCalendarApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROOT_KEY }),
  });
}
