import { api } from "@/shared/api/axios";
import type { SalesResponse, SalesSummary } from "../model/types";

export const paymentApi = {
  getTodaySalesSummary: () =>
    api.get<SalesSummary>("/api/sales/today-summary").then((r) => r.data),
  getSales: (params: { startDate: string; endDate: string }) =>
    api.get<SalesResponse>("/api/sales", { params }).then((r) => r.data),
};
