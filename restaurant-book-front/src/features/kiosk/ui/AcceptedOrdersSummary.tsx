import { XCircle } from "lucide-react";
import type { Order } from "@/entities/order/model/types";
import { cn } from "@/shared/lib/utils";
import { orderStatusBadgeClass, orderStatusCardClass, orderStatusLabel } from "../model/constants";
import { OrderHistoryItem } from "./OrderHistoryItem";

function OrderStatusBadge({ status }: { status: Order["status"] }) {
  return (
    <span
      className={`shrink-0 rounded-md border px-2 py-1 text-xs font-bold ${orderStatusBadgeClass[status]}`}
    >
      {orderStatusLabel[status]}
    </span>
  );
}

export function AcceptedOrdersSummary({
  orders,
  cancelingOrderId,
  onCancelOrder,
}: {
  orders: Order[];
  cancelingOrderId: number | null;
  onCancelOrder: (orderId: number) => void;
}) {
  return (
    <section className="space-y-3 bg-muted/20 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold">접수된 주문</p>
        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
          {orders.length}건
        </span>
      </div>
      <div className="space-y-2">
        {orders.map((order) => {
          const canCancelByCustomer = order.status === "RECEIVED";
          const shouldShowCancelGuide = order.status === "ACCEPTED";
          const shouldShowCancelControl = canCancelByCustomer || shouldShowCancelGuide;
          const isCanceling = cancelingOrderId === order.id;
          return (
            <div
              key={order.id}
              className={`rounded-md border p-2 pl-3 ${orderStatusCardClass[order.status]}`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-xs font-semibold text-muted-foreground">
                  주문번호: {order.orderNo}
                </p>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="space-y-2 rounded-md bg-muted/20 p-2">
                {order.items.map((item) => (
                  <OrderHistoryItem key={item.id} item={item} compact />
                ))}
              </div>
              {shouldShowCancelControl ? (
                <button
                  type="button"
                  onClick={() => {
                    if (canCancelByCustomer) {
                      onCancelOrder(order.id);
                    }
                  }}
                  disabled={!canCancelByCustomer || isCanceling}
                  className={cn(
                    "mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-md border text-sm font-bold transition-colors disabled:cursor-not-allowed",
                    canCancelByCustomer
                      ? "border-red-500/30 bg-background text-red-600 hover:bg-red-50 disabled:opacity-50"
                      : "border-border bg-muted/60 text-muted-foreground opacity-80",
                  )}
                >
                  <XCircle className="h-4 w-4" />
                  {isCanceling ? "취소 중" : canCancelByCustomer ? "주문 취소" : "접수 후 취소는 직원 문의"}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
