import { api } from "@/shared/api/axios";
import type { CompleteOperationOrderBody, CreateOrderBody, Order } from "../model/types";

export const orderApi = {
  createCustomerOrder: (body: CreateOrderBody) =>
    api.post<Order>("/api/customer/orders", body).then((r) => r.data),
  getActiveCustomerOrders: (tableName: string) =>
    api
      .get<Order[]>("/api/customer/orders/active", { params: { tableName } })
      .then((r) => r.data),
  getCanceledCustomerOrders: (tableName: string) =>
    api
      .get<Order[]>("/api/customer/orders/canceled", { params: { tableName } })
      .then((r) => r.data),
  acknowledgeCustomerCanceledOrders: (tableName: string) =>
    api
      .patch<void>("/api/customer/orders/canceled/acknowledge", null, { params: { tableName } })
      .then((r) => r.data),
  cancelCustomerOrder: (orderId: number, tableName: string) =>
    api
      .patch<Order>(`/api/customer/orders/${orderId}/cancel`, { tableName })
      .then((r) => r.data),
  getKitchenOrders: () =>
    api.get<Order[]>("/api/kitchen/orders").then((r) => r.data),
  getCanceledKitchenOrders: () =>
    api.get<Order[]>("/api/kitchen/orders/canceled").then((r) => r.data),
  acceptKitchenOrder: (orderId: number) =>
    api.patch<Order>(`/api/kitchen/orders/${orderId}/accept`).then((r) => r.data),
  startCookingKitchenOrder: (orderId: number) =>
    api.patch<Order>(`/api/kitchen/orders/${orderId}/start-cooking`).then((r) => r.data),
  readyKitchenOrder: (orderId: number) =>
    api.patch<Order>(`/api/kitchen/orders/${orderId}/ready`).then((r) => r.data),
  cancelKitchenOrder: (orderId: number, cancelMessage: string) =>
    api
      .patch<Order>(`/api/kitchen/orders/${orderId}/cancel`, { cancelMessage })
      .then((r) => r.data),
  getReadyOperationOrders: () =>
    api.get<Order[]>("/api/operations/orders/ready").then((r) => r.data),
  getOperationOrders: () =>
    api.get<Order[]>("/api/operations/orders").then((r) => r.data),
  getCanceledOperationOrders: () =>
    api.get<Order[]>("/api/operations/orders/canceled").then((r) => r.data),
  acknowledgeOperationCanceledOrders: (tableName: string) =>
    api
      .patch<void>("/api/operations/orders/canceled/acknowledge", null, { params: { tableName } })
      .then((r) => r.data),
  completeOperationOrder: (orderId: number, body: CompleteOperationOrderBody) =>
    api.patch<Order>(`/api/operations/orders/${orderId}/complete`, body).then((r) => r.data),
  cancelOperationOrder: (orderId: number, cancelMessage: string) =>
    api
      .patch<Order>(`/api/operations/orders/${orderId}/cancel`, { cancelMessage })
      .then((r) => r.data),
};
