import { api } from "@/shared/api/axios";
import type { SaleMenu, SaleMenuFilters, SaleMenuStatus } from "../model/types";

export type CreateSaleMenuBody = {
  categoryId: number | null;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  status: SaleMenuStatus;
  visible: boolean;
  availableDineIn: boolean;
  availableTakeout: boolean;
  requiresCooking: boolean;
  displayOrder: number;
};

export type UpdateSaleMenuBody = CreateSaleMenuBody;

export const saleMenuApi = {
  list: (filters: SaleMenuFilters = {}) =>
    api.get<SaleMenu[]>("/api/sale-menus", { params: filters }).then((r) => r.data),

  get: (id: number) =>
    api.get<SaleMenu>(`/api/sale-menus/${id}`).then((r) => r.data),

  create: (body: CreateSaleMenuBody) =>
    api.post<SaleMenu>("/api/sale-menus", body).then((r) => r.data),

  update: (id: number, body: UpdateSaleMenuBody) =>
    api.patch<SaleMenu>(`/api/sale-menus/${id}`, body).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/api/sale-menus/${id}`).then((r) => r.data),
};
