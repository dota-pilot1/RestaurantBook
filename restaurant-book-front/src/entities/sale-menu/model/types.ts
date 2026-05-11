import type { SaleMenuCategorySummary } from "@/entities/sale-menu-category/model/types";

export type SaleMenuStatus = "ACTIVE" | "SOLD_OUT" | "HIDDEN";

export type SaleMenu = {
  id: number;
  category: SaleMenuCategorySummary | null;
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
  requiresCooking: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SaleMenuFilters = {
  categoryId?: number;
  status?: SaleMenuStatus;
  visible?: boolean;
  keyword?: string;
};
