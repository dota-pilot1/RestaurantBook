import type { Order } from "@/entities/order/model/types";

export type TossPaymentConfig = {
  clientKey: string;
};

export type ConfirmTossPaymentBody = {
  tossOrderId: string;
  paymentKey: string;
  amount: number;
  tableName: string;
  restaurantOrderIds: number[];
};

export type ConfirmTossPaymentResponse = {
  paymentId: number;
  amount: number;
  orders: Order[];
};
