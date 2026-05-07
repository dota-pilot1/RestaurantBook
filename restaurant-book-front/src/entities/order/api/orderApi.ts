import { api } from "@/shared/api/axios";
import type { CreateOrderBody, Order } from "../model/types";

export const orderApi = {
  createCustomerOrder: (body: CreateOrderBody) =>
    api.post<Order>("/api/customer/orders", body).then((r) => r.data),
};
