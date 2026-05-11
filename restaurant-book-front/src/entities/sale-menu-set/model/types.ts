import type { SaleMenuStatus } from "@/entities/sale-menu/model/types";

export type SaleMenuSetItem = {
  id: number;
  saleMenu: {
    id: number;
    name: string;
    price: number;
  };
  quantity: number;
  displayOrder: number;
};

export type SaleMenuSet = {
  id: number;
  name: string;
  description: string | null;
  detailDescription: string | null;
  ingredients: string | null;
  allergens: string | null;
  caloriesKcal: number | null;
  carbohydrateG: number | null;
  proteinG: number | null;
  fatG: number | null;
  sodiumMg: number | null;
  price: number;
  imageUrl: string | null;
  status: SaleMenuStatus;
  visible: boolean;
  availableDineIn: boolean;
  availableTakeout: boolean;
  displayOrder: number;
  items: SaleMenuSetItem[];
  createdAt: string;
  updatedAt: string;
};

export type SaleMenuSetFilters = {
  status?: SaleMenuStatus;
  visible?: boolean;
  keyword?: string;
};
