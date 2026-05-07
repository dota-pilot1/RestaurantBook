import { api } from "@/shared/api/axios";
import type { RestaurantTable } from "../model/types";

export type CreateRestaurantTableBody = {
  name: string;
  active: boolean;
  displayOrder: number;
};

export type UpdateRestaurantTableBody = CreateRestaurantTableBody;

export const restaurantTableApi = {
  list: () =>
    api.get<RestaurantTable[]>("/api/tables").then((r) => r.data),

  listActive: () =>
    api.get<RestaurantTable[]>("/api/tables/active").then((r) => r.data),

  create: (body: CreateRestaurantTableBody) =>
    api.post<RestaurantTable>("/api/tables", body).then((r) => r.data),

  update: (id: number, body: UpdateRestaurantTableBody) =>
    api.patch<RestaurantTable>(`/api/tables/${id}`, body).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/api/tables/${id}`).then((r) => r.data),
};
