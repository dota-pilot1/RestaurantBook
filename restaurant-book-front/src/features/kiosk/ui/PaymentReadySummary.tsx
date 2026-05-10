import { Check } from "lucide-react";
import type { Order } from "@/entities/order/model/types";
import { cn } from "@/shared/lib/utils";
import { formatPrice } from "../lib/format";
import { getOrderQuantity } from "../lib/order";
import type { PaymentSelectionMode } from "../model/types";

export function PaymentReadySummary({
  mode,
  orders,
  selectedOrderIds,
  tableName,
  totalPrice,
  onToggleOrder,
}: {
  mode: PaymentSelectionMode;
  orders: Order[];
  selectedOrderIds: Set<number>;
  tableName: string;
  totalPrice: number;
  onToggleOrder: (orderId: number) => void;
}) {
  const selectedOrders = orders.filter((order) => selectedOrderIds.has(order.id));
  const totalQuantity = selectedOrders.reduce((sum, order) => sum + getOrderQuantity(order), 0);
  const modeLabel = mode === "SINGLE" ? "단건 결제" : "다건 결제";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs">
        <div>
          <p className="text-muted-foreground">테이블</p>
          <p className="mt-1 font-bold text-foreground">{tableName || "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">결제 방식</p>
          <p className="mt-1 font-bold text-foreground">{modeLabel}</p>
        </div>
        <div>
          <p className="text-muted-foreground">선택 주문</p>
          <p className="mt-1 font-bold text-foreground">
            {selectedOrders.length}/{orders.length}건
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">수량</p>
          <p className="mt-1 font-bold text-foreground">{totalQuantity}개</p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground">결제 금액</p>
          <p className="mt-1 font-bold text-foreground">{formatPrice(totalPrice)}원</p>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto rounded-md border border-border">
        {orders.map((order) => (
          <div key={order.id} className="border-b border-border last:border-b-0">
            <button
              type="button"
              onClick={() => onToggleOrder(order.id)}
              className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-accent/50"
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                  selectedOrderIds.has(order.id)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background",
                )}
              >
                {selectedOrderIds.has(order.id) ? <Check className="h-3 w-3" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-xs font-semibold text-muted-foreground">
                    주문번호: {order.orderNo}
                  </span>
                  <span className="shrink-0 text-sm font-black">
                    {formatPrice(order.totalAmount)}원
                  </span>
                </span>
                <span className="mt-2 block space-y-1">
                  {order.items.map((item) => (
                    <span key={item.id} className="flex items-start justify-between gap-3 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-foreground">{item.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatPrice(item.unitPrice)}원 x {item.quantity}
                        </span>
                      </span>
                      <span className="shrink-0 font-bold text-foreground">
                        {formatPrice(item.lineTotal)}원
                      </span>
                    </span>
                  ))}
                </span>
              </span>
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 text-emerald-700">
        <span className="text-sm font-bold">총 결제 예정 금액</span>
        <span className="text-lg font-black">{formatPrice(totalPrice)}원</span>
      </div>
    </div>
  );
}
