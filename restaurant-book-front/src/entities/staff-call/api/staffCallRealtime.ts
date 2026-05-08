"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useAppWebSocketTopic } from "@/shared/hooks/useAppWebSocket";

export type StaffCallChangedPayload = {
  reason?: "CREATED" | "ACKNOWLEDGED" | "CANCELED";
  callId?: number;
  tableName?: string;
};

export function useOperationsStaffCallsWebSocket(
  enabled = true,
  onChanged?: (payload: StaffCallChangedPayload) => void,
) {
  const queryClient = useQueryClient();

  useAppWebSocketTopic("staff-calls:operations", enabled, (message) => {
    if (message.type !== "STAFF_CALL_LIST_CHANGED") {
      return;
    }
    const payload = toPayload(message.data);
    queryClient.invalidateQueries({ queryKey: ["operations-staff-calls"] });
    queryClient.invalidateQueries({ queryKey: ["manager-dashboard"] });
    queryClient.refetchQueries({ queryKey: ["operations-staff-calls"], type: "active" });
    queryClient.refetchQueries({ queryKey: ["manager-dashboard"], type: "active" });
    onChanged?.(payload);
  });
}

export function useCustomerStaffCallsWebSocket(
  tableName: string,
  enabled = true,
  onChanged?: (payload: StaffCallChangedPayload) => void,
) {
  const queryClient = useQueryClient();
  const normalizedTableName = tableName.trim();

  useAppWebSocketTopic(
    normalizedTableName ? `customer:calls/${normalizedTableName}` : null,
    enabled && normalizedTableName.length > 0,
    (message) => {
      if (message.type !== "CUSTOMER_CALLS_CHANGED") {
        return;
      }
      const payload = toPayload(message.data);
      queryClient.invalidateQueries({ queryKey: ["customer-active-staff-calls", tableName] });
      queryClient.refetchQueries({ queryKey: ["customer-active-staff-calls", tableName], type: "active" });
      onChanged?.(payload);
    },
  );
}

function toPayload(data: unknown): StaffCallChangedPayload {
  if (!data || typeof data !== "object") {
    return {};
  }
  const record = data as Record<string, unknown>;
  return {
    reason: typeof record.reason === "string" ? (record.reason as StaffCallChangedPayload["reason"]) : undefined,
    callId: typeof record.callId === "number" ? record.callId : undefined,
    tableName: typeof record.tableName === "string" ? record.tableName : undefined,
  };
}
