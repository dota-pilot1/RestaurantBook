import type {
  CustomerOrderType,
  SaleProductType,
} from "@/entities/customer-sale-product/model/types";
import type { PaymentMethod } from "@/entities/payment/model/types";

export type OrderStatus =
  | "RECEIVED"
  | "ACCEPTED"
  | "COOKING"
  | "READY"
  | "COMPLETED"
  | "CANCELED";

export type CreateOrderItem = {
  type: SaleProductType;
  id: number;
  quantity: number;
};

export type CreateOrderBody = {
  tableName?: string | null;
  orderType: CustomerOrderType;
  items: CreateOrderItem[];
};

export type CompleteOperationOrderBody = {
  paymentMethod: PaymentMethod;
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
  tableName: string | null;
  orderType: CustomerOrderType;
  status: OrderStatus;
  totalAmount: number;
  cancelMessage: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};
