import { api } from "@/shared/api/axios";
import type { CreateOrderBody, Order } from "../model/types";

export const orderApi = {
  createCustomerOrder: (body: CreateOrderBody) =>
    api.post<Order>("/api/customer/orders", body).then((r) => r.data),
  getActiveCustomerOrders: (tableName: string) =>
    api
      .get<Order[]>("/api/customer/orders/active", { params: { tableName } })
      .then((r) => r.data),
  cancelCustomerOrder: (orderId: number, tableName: string) =>
    api
      .patch<Order>(`/api/customer/orders/${orderId}/cancel`, { tableName })
      .then((r) => r.data),
};
