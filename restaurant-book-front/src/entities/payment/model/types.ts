export type PaymentMethod = "CARD" | "CASH" | "ETC";

export type PaymentStatus = "PAID" | "CANCELED" | "REFUNDED";

export type PaymentMethodSummary = {
  method: PaymentMethod;
  amount: number;
  count: number;
};

export type PaymentListItem = {
  id: number;
  orderId: number;
  orderNo: string;
  tableName: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string;
  handledBy: number | null;
};

export type SalesSummary = {
  totalAmount: number;
  paymentCount: number;
  methodSummaries: PaymentMethodSummary[];
};

export type SalesResponse = SalesSummary & {
  startDate: string;
  endDate: string;
  recentPayments: PaymentListItem[];
};
