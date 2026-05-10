import type { Order } from "@/entities/order/model/types";
import { formatPrice } from "../lib/format";

export function OrderHistoryItem({
  item,
  compact = false,
}: {
  item: Order["items"][number];
  compact?: boolean;
}) {
  return (
    <div className={compact ? "rounded-md bg-muted/30 p-2" : ""}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatPrice(item.unitPrice)}원 x {item.quantity}
          </p>
        </div>
        <span className="shrink-0 text-sm font-bold">
          {formatPrice(item.lineTotal)}원
        </span>
      </div>
      {item.type === "SALE_MENU_SET" && item.components.length > 0 && (
        <div className="mt-2 space-y-1 rounded-md bg-muted/50 p-2">
          {item.components.map((component) => (
            <div
              key={`${item.id}:${component.name}:${component.quantity}`}
              className="flex min-h-5 items-center justify-between gap-2 text-xs"
            >
              <span className="min-w-0 truncate text-muted-foreground">
                {component.name}
              </span>
              <span className="shrink-0 font-semibold text-foreground">
                x{component.quantity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
