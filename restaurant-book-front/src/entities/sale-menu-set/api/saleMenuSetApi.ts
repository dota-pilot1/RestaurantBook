import { api } from "@/shared/api/axios";
import type { SaleMenuStatus } from "@/entities/sale-menu/model/types";
import type { SaleMenuSet, SaleMenuSetFilters } from "../model/types";

export type SaleMenuSetItemBody = {
  saleMenuId: number;
  quantity: number;
  displayOrder: number;
};

export type CreateSaleMenuSetBody = {
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  status: SaleMenuStatus;
  visible: boolean;
  availableDineIn: boolean;
  availableTakeout: boolean;
  displayOrder: number;
  items: SaleMenuSetItemBody[];
};

export type UpdateSaleMenuSetBody = CreateSaleMenuSetBody;

export const saleMenuSetApi = {
  list: (filters: SaleMenuSetFilters = {}) =>
    api.get<SaleMenuSet[]>("/api/sale-menu-sets", { params: filters }).then((r) => r.data),

  get: (id: number) =>
    api.get<SaleMenuSet>(`/api/sale-menu-sets/${id}`).then((r) => r.data),

  create: (body: CreateSaleMenuSetBody) =>
    api.post<SaleMenuSet>("/api/sale-menu-sets", body).then((r) => r.data),

  update: (id: number, body: UpdateSaleMenuSetBody) =>
    api.patch<SaleMenuSet>(`/api/sale-menu-sets/${id}`, body).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/api/sale-menu-sets/${id}`).then((r) => r.data),
};
