export type PaymentMethod = "CARD" | "CASH" | "EASY_PAY" | "TRANSFER" | "ETC";

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
  providerMethod: string | null;
  status: PaymentStatus;
  paidAt: string;
  refundedAt: string | null;
  handledBy: number | null;
  refundedBy: number | null;
};

export type SalesSummary = {
  totalAmount: number;
  paymentCount: number;
  refundAmount: number;
  refundCount: number;
  methodSummaries: PaymentMethodSummary[];
};

export type SalesResponse = SalesSummary & {
  startDate: string;
  endDate: string;
  recentPayments: PaymentListItem[];
  refundedPayments: PaymentListItem[];
};
