import type { Order } from "@/entities/order/model/types";
import { formatPrice } from "../lib/format";
import { orderStatusLabel } from "../model/constants";
import type { CartItem } from "../model/types";

export function OrderNoticeSummary({ order, tableName }: { order: Order; tableName: string }) {
  return (
    <OrderResultSummary
      order={order}
      tableName={tableName}
      statusLabel={orderStatusLabel[order.status]}
      amountLabel="주문 금액"
      amountClassName="bg-emerald-50 text-emerald-700"
    />
  );
}

export function OrderConfirmSummary({
  tableName,
  orderTypeLabel,
  items,
  totalQuantity,
  totalPrice,
}: {
  tableName: string;
  orderTypeLabel: string;
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs">
        <div>
          <p className="text-muted-foreground">테이블</p>
          <p className="mt-1 font-bold text-foreground">{tableName || "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">주문 유형</p>
          <p className="mt-1 font-bold text-foreground">{orderTypeLabel}</p>
        </div>
        <div>
          <p className="text-muted-foreground">수량</p>
          <p className="mt-1 font-bold text-foreground">{totalQuantity}개</p>
        </div>
        <div>
          <p className="text-muted-foreground">금액</p>
          <p className="mt-1 font-bold text-foreground">{formatPrice(totalPrice)}원</p>
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto rounded-md border border-border">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-start justify-between gap-3 border-b border-border px-3 py-2 last:border-b-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatPrice(item.price)}원 x {item.quantity}
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold text-foreground">
              {formatPrice(item.price * item.quantity)}원
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CanceledOrderSummary({ order, tableName }: { order: Order; tableName: string }) {
  return (
    <OrderResultSummary
      order={order}
      tableName={tableName}
      statusLabel="취소"
      amountLabel="취소 금액"
      amountClassName="bg-red-50 text-red-700"
    />
  );
}

function OrderResultSummary({
  order,
  tableName,
  statusLabel,
  amountLabel,
  amountClassName,
}: {
  order: Order;
  tableName: string;
  statusLabel: string;
  amountLabel: string;
  amountClassName: string;
}) {
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs">
        <div>
          <p className="text-muted-foreground">주문번호</p>
          <p className="mt-1 break-all font-bold text-foreground">{order.orderNo}</p>
        </div>
        <div>
          <p className="text-muted-foreground">테이블</p>
          <p className="mt-1 font-bold text-foreground">{tableName || "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">상태</p>
          <p className="mt-1 font-bold text-foreground">{statusLabel}</p>
        </div>
        <div>
          <p className="text-muted-foreground">수량</p>
          <p className="mt-1 font-bold text-foreground">{totalQuantity}개</p>
        </div>
      </div>

      <div className="rounded-md border border-border">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-3 border-b border-border px-3 py-2 last:border-b-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatPrice(item.unitPrice)}원 x {item.quantity}
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold text-foreground">
              {formatPrice(item.lineTotal)}원
            </p>
          </div>
        ))}
      </div>

      <div className={`flex items-center justify-between rounded-md px-3 py-2 ${amountClassName}`}>
        <span className="text-sm font-bold">{amountLabel}</span>
        <span className="text-lg font-black">
          {formatPrice(order.totalAmount)}원
        </span>
      </div>
      {order.status === "CANCELED" && order.cancelMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs font-bold text-red-700">취소 안내</p>
          <p className="mt-1 text-sm font-semibold text-red-800">{order.cancelMessage}</p>
        </div>
      ) : null}
    </div>
  );
}
