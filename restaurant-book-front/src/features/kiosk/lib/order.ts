import type { Order } from "@/entities/order/model/types";

export const getOrderQuantity = (order: Order) =>
  order.items.reduce((sum, item) => sum + item.quantity, 0);
