import { api } from "@/shared/api/axios";
import type {
  CancelStaffCallBody,
  CreateStaffCallBody,
  StaffCall,
} from "../model/types";

export const staffCallApi = {
  createCustomerCall: (body: CreateStaffCallBody) =>
    api.post<StaffCall>("/api/customer/staff-calls", body).then((r) => r.data),
  getActiveCustomerCalls: (tableName: string) =>
    api
      .get<StaffCall[]>("/api/customer/staff-calls/active", { params: { tableName } })
      .then((r) => r.data),
  cancelCustomerCall: (callId: number, body: CancelStaffCallBody) =>
    api
      .patch<void>(`/api/customer/staff-calls/${callId}/cancel`, body)
      .then((r) => r.data),
  getPendingOperationsCalls: () =>
    api.get<StaffCall[]>("/api/operations/staff-calls").then((r) => r.data),
  acknowledgeOperationsCall: (callId: number) =>
    api.patch<StaffCall>(`/api/operations/staff-calls/${callId}/acknowledge`).then((r) => r.data),
};
