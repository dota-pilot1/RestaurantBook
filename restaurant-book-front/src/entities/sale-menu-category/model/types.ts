export type SaleMenuCategory = {
  id: number;
  name: string;
  description: string | null;
  visible: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SaleMenuCategorySummary = {
  id: number;
  name: string;
};
