import { api } from "@/shared/api/axios";
import type { ManagerDashboard } from "../model/types";

export const managerApi = {
  getDashboard: () =>
    api.get<ManagerDashboard>("/api/manager/dashboard").then((r) => r.data),
};
