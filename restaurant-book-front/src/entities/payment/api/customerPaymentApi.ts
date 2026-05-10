import { api } from "@/shared/api/axios";
import type {
  ConfirmTossPaymentBody,
  ConfirmTossPaymentResponse,
  TossPaymentConfig,
} from "../model/customerPaymentTypes";

export const customerPaymentApi = {
  getTossPaymentConfig: () =>
    api.get<TossPaymentConfig>("/api/customer/payments/config").then((r) => r.data),
  confirmTossPayment: (body: ConfirmTossPaymentBody) =>
    api.post<ConfirmTossPaymentResponse>("/api/customer/payments/toss/confirm", body).then((r) => r.data),
};
