"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useAppWebSocketTopic } from "@/shared/hooks/useAppWebSocket";
import type { Order } from "@/entities/order/model/types";

export type OrderListChangedPayload = {
  reason?: string;
  orderId?: number;
  tableName?: string;
  cancelMessage?: string;
};

export function useOperationalOrdersWebSocket(
  enabled = true,
  onOrderListChanged?: (payload: OrderListChangedPayload) => void,
) {
  const queryClient = useQueryClient();

  useAppWebSocketTopic("orders:operations", enabled, (message) => {
    if (message.type !== "ORDER_LIST_CHANGED") {
      return;
    }
    const payload = toOrderListChangedPayload(message.data);
    queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
    queryClient.invalidateQueries({ queryKey: ["kitchen-canceled-orders"] });
    queryClient.invalidateQueries({ queryKey: ["operation-orders"] });
    queryClient.invalidateQueries({ queryKey: ["operation-canceled-orders"] });
    queryClient.invalidateQueries({ queryKey: ["operation-ready-orders"] });
    queryClient.invalidateQueries({ queryKey: ["manager-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["sales"] });
    queryClient.refetchQueries({ queryKey: ["kitchen-orders"], type: "active" });
    queryClient.refetchQueries({ queryKey: ["kitchen-canceled-orders"], type: "active" });
    queryClient.refetchQueries({ queryKey: ["operation-orders"], type: "active" });
    queryClient.refetchQueries({ queryKey: ["operation-canceled-orders"], type: "active" });
    queryClient.refetchQueries({ queryKey: ["operation-ready-orders"], type: "active" });
    queryClient.refetchQueries({ queryKey: ["manager-dashboard"], type: "active" });
    onOrderListChanged?.(payload);
  });
}

export function useCustomerOrdersWebSocket(
  tableName: string,
  enabled = true,
  onCustomerOrdersChanged?: (payload: OrderListChangedPayload) => void,
) {
  const queryClient = useQueryClient();
  const normalizedTableName = tableName.trim();

  useAppWebSocketTopic(
    normalizedTableName ? `customer:orders/${normalizedTableName}` : null,
    enabled && normalizedTableName.length > 0,
    (message) => {
      if (message.type !== "CUSTOMER_ORDERS_CHANGED") {
        return;
      }
      const payload = toOrderListChangedPayload(message.data);
      onCustomerOrdersChanged?.(payload);
      if (payload.reason === "COMPLETED" && payload.orderId) {
        queryClient.setQueryData<Order[]>(["customer-active-orders", tableName], (current) =>
          current?.filter((order) => order.id !== payload.orderId) ?? current,
        );
      }
      queryClient.invalidateQueries({ queryKey: ["customer-active-orders", tableName] });
      queryClient.invalidateQueries({ queryKey: ["customer-canceled-orders", tableName] });
      queryClient.refetchQueries({ queryKey: ["customer-active-orders", tableName], type: "active" });
      queryClient.refetchQueries({ queryKey: ["customer-canceled-orders", tableName], type: "active" });
    },
  );
}

function toOrderListChangedPayload(data: unknown): OrderListChangedPayload {
  if (!data || typeof data !== "object") {
    return {};
  }
  const record = data as Record<string, unknown>;
  return {
    reason: typeof record.reason === "string" ? record.reason : undefined,
    orderId: typeof record.orderId === "number" ? record.orderId : undefined,
    tableName: typeof record.tableName === "string" ? record.tableName : undefined,
    cancelMessage: typeof record.cancelMessage === "string" ? record.cancelMessage : undefined,
  };
}
