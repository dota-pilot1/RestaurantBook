import type { SaleProductType } from "@/entities/customer-sale-product/model/types";
import type { CartItemKey } from "../model/types";

export const toCartKey = (type: SaleProductType, id: number): CartItemKey => `${type}:${id}`;
