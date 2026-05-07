import { api } from "@/shared/api/axios";
import type {
  CustomerSaleProduct,
  CustomerSaleProductFilters,
} from "../model/types";

export const customerSaleProductApi = {
  list: (filters: CustomerSaleProductFilters) =>
    api
      .get<CustomerSaleProduct[]>("/api/customer/sale-products", { params: filters })
      .then((r) => r.data),
};
