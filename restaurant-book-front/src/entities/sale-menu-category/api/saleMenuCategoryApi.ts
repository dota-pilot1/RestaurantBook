import { api } from "@/shared/api/axios";
import type { SaleMenuCategory } from "../model/types";

export type CreateSaleMenuCategoryBody = {
  name: string;
  description: string | null;
  visible: boolean;
  displayOrder: number;
};

export type UpdateSaleMenuCategoryBody = CreateSaleMenuCategoryBody;

export const saleMenuCategoryApi = {
  list: () =>
    api.get<SaleMenuCategory[]>("/api/sale-menu-categories").then((r) => r.data),

  create: (body: CreateSaleMenuCategoryBody) =>
    api.post<SaleMenuCategory>("/api/sale-menu-categories", body).then((r) => r.data),

  update: (id: number, body: UpdateSaleMenuCategoryBody) =>
    api.patch<SaleMenuCategory>(`/api/sale-menu-categories/${id}`, body).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/api/sale-menu-categories/${id}`).then((r) => r.data),
};
