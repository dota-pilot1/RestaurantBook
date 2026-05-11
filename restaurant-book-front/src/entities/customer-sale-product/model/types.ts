import type { SaleMenuCategorySummary } from "@/entities/sale-menu-category/model/types";

export type SaleProductType = "SALE_MENU" | "SALE_MENU_SET";

export type CustomerOrderType = "DINE_IN" | "TAKEOUT";

export type SaleProductSection = "ALL" | "SET" | "MENU";

export type CustomerSaleProductComponent = {
  name: string;
  quantity: number;
};

export type CustomerSaleProductDetail = {
  description: string | null;
  ingredients: string | null;
  allergens: string | null;
};

export type CustomerSaleProductNutrition = {
  caloriesKcal: number | null;
  carbohydrateG: number | null;
  proteinG: number | null;
  fatG: number | null;
  sodiumMg: number | null;
};

export type CustomerSaleProduct = {
  type: SaleProductType;
  id: number;
  category: SaleMenuCategorySummary | null;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  status: "ACTIVE" | "SOLD_OUT" | "HIDDEN";
  displayOrder: number;
  components: CustomerSaleProductComponent[];
  detail: CustomerSaleProductDetail | null;
  nutrition: CustomerSaleProductNutrition | null;
};

export type CustomerSaleProductFilters = {
  orderType?: CustomerOrderType;
  section?: SaleProductSection;
  categoryId?: number;
};
