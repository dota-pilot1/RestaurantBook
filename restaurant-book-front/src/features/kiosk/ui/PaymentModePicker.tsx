import type { Order } from "@/entities/order/model/types";
import { formatPrice } from "../lib/format";
import type { PaymentSelectionMode } from "../model/types";

export function PaymentModePicker({
  orders,
  onSelectMode,
}: {
  orders: Order[];
  onSelectMode: (mode: PaymentSelectionMode) => void;
}) {
  const totalPrice = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const multipleAvailable = orders.length >= 2;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => onSelectMode("SINGLE")}
        className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-background p-4 text-left transition-colors hover:border-primary hover:bg-accent/40"
      >
        <span className="min-w-0">
          <span className="block text-sm font-black text-foreground">단건 결제</span>
          <span className="mt-1 block text-xs font-semibold text-muted-foreground">
            결제 대기 주문 중 1건만 선택합니다.
          </span>
        </span>
        <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-black">
          1건
        </span>
      </button>

      <button
        type="button"
        disabled={!multipleAvailable}
        onClick={() => onSelectMode("BUNDLE")}
        className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-background p-4 text-left transition-colors hover:border-primary hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <span className="min-w-0">
          <span className="block text-sm font-black text-foreground">다건 결제</span>
          <span className="mt-1 block text-xs font-semibold text-muted-foreground">
            여러 주문을 묶어서 토스 결제창을 한 번만 엽니다.
          </span>
        </span>
        <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">
          {orders.length}건
        </span>
      </button>

      <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
        <span className="font-semibold text-muted-foreground">전체 결제 가능 금액</span>
        <span className="font-black">{formatPrice(totalPrice)}원</span>
      </div>
    </div>
  );
}
