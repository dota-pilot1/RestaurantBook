import type { SaleProductType } from "@/entities/customer-sale-product/model/types";
import type { Order } from "@/entities/order/model/types";

export type KioskOrderType = "dine-in" | "takeout";
export type PaymentSelectionMode = "SINGLE" | "BUNDLE";

export type KioskTab =
  | { type: "ALL"; label: string }
  | { type: "SET"; label: string }
  | { type: "MENU"; categoryId: number; label: string };

export type CartItemKey = `${SaleProductType}:${number}`;

export type CartItem = {
  key: CartItemKey;
  type: SaleProductType;
  id: number;
  name: string;
  price: number;
  quantity: number;
  components: {
    name: string;
    quantity: number;
  }[];
};

export type CancelNoticeItem = {
  id: number;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type CancelNotice = {
  key: string;
  orderId: number | null;
  orderNo: string | null;
  message: string;
  receivedAt: Date;
  items: CancelNoticeItem[];
  totalAmount: number | null;
  totalQuantity: number | null;
};

export type OrderStatus = Order["status"];
