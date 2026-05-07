import { api } from "@/shared/api/axios";
import type { NavigationMenuRecord } from "../model/types";

export type CreateNavigationMenuBody = {
  code: string;
  parentId: number | null;
  label: string;
  labelKey: string | null;
  path: string | null;
  icon: string | null;
  isExternal: boolean;
  requiredRole: string | null;
  requiredPermission: string | null;
  visible: boolean;
  displayOrder: number;
};

export type UpdateNavigationMenuBody = Omit<CreateNavigationMenuBody, "code">;

export const navigationMenuApi = {
  getAll: () => api.get<NavigationMenuRecord[]>("/api/navigation-menus").then((r) => r.data),
  create: (body: CreateNavigationMenuBody) =>
    api.post<NavigationMenuRecord>("/api/navigation-menus", body).then((r) => r.data),
  update: (id: number, body: UpdateNavigationMenuBody) =>
    api.patch<NavigationMenuRecord>(`/api/navigation-menus/${id}`, body).then((r) => r.data),
  delete: (id: number) => api.delete(`/api/navigation-menus/${id}`),
};
