import type {
  CustomerOrderType,
  SaleProductType,
} from "@/entities/customer-sale-product/model/types";

export type OrderStatus = "RECEIVED" | "COOKING" | "READY" | "COMPLETED" | "CANCELED";

export type CreateOrderItem = {
  type: SaleProductType;
  id: number;
  quantity: number;
};

export type CreateOrderBody = {
  orderType: CustomerOrderType;
  items: CreateOrderItem[];
};

export type OrderItemComponent = {
  name: string;
  quantity: number;
};

export type OrderItem = {
  id: number;
  type: SaleProductType;
  saleMenuId: number | null;
  saleMenuSetId: number | null;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  components: OrderItemComponent[];
};

export type Order = {
  id: number;
  orderNo: string;
  orderType: CustomerOrderType;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
};
