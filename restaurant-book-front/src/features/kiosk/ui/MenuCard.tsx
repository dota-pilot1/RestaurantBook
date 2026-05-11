import { Check, ImageIcon, Info, Minus, Plus } from "lucide-react";
import type { CustomerSaleProduct } from "@/entities/customer-sale-product/model/types";
import { formatPrice } from "../lib/format";
import { QuantityButton } from "./QuantityButton";

export function MenuCard({
  product,
  quantity,
  onMinus,
  onPlus,
  onOpenDetail,
  onToggle,
}: {
  product: CustomerSaleProduct;
  quantity: number;
  onMinus: () => void;
  onPlus: () => void;
  onOpenDetail: () => void;
  onToggle: () => void;
}) {
  const soldOut = product.status === "SOLD_OUT";
  const isSet = product.type === "SALE_MENU_SET";
  const visibleComponents = product.components.slice(0, 4);
  const hiddenComponentCount = Math.max(0, product.components.length - visibleComponents.length);
  const canToggle = !soldOut || quantity > 0;

  return (
    <article
      aria-label={quantity > 0 ? `${product.name} 선택 취소` : `${product.name} 담기`}
      className={`relative rounded-lg border bg-white transition-colors ${
        !canToggle
          ? "opacity-75"
          : "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      } ${
        quantity > 0
          ? "border-zinc-900 shadow-sm"
          : "border-zinc-300 hover:border-zinc-600"
      }`}
      onClick={canToggle ? onToggle : undefined}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (canToggle) onToggle();
      }}
      role="button"
      tabIndex={canToggle ? 0 : -1}
    >
      {quantity > 0 && (
        <>
          <div className="pointer-events-none absolute inset-0 z-20 rounded-lg ring-2 ring-inset ring-zinc-950" />
          <div className="absolute right-2 top-2 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 shadow-md">
            <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
          </div>
        </>
      )}
      <div className="relative h-28 overflow-hidden rounded-t-lg bg-zinc-100">
        {product.imageUrl ? (
          <div
            aria-label={product.name}
            className="h-full w-full bg-cover bg-center"
            role="img"
            style={{ backgroundImage: `url(${product.imageUrl})` }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
        {quantity === 0 && (
          <button
            type="button"
            aria-label={`${product.name} 상세 정보 보기`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onOpenDetail();
            }}
            className="absolute right-2 top-2 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/95 text-zinc-900 shadow-md transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Info className="h-4 w-4" />
          </button>
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-md bg-background/95 px-2 py-1 text-xs font-bold text-destructive shadow-sm">
            품절
          </span>
        )}
      </div>
      <div className="space-y-4 p-4">
        <div className="min-h-28">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 text-lg font-bold tracking-tight">{product.name}</h3>
            {isSet && (
              <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-muted-foreground">
                세트
              </span>
            )}
          </div>
          {isSet ? (
            <div className="mt-2 space-y-2">
              {product.description && (
                <p className="line-clamp-1 text-sm text-muted-foreground">
                  {product.description}
                </p>
              )}
              {product.components.length > 0 ? (
                <div className="space-y-1 rounded-md bg-zinc-50 p-2">
                  {visibleComponents.map((component) => (
                    <div
                      key={`${component.name}:${component.quantity}`}
                      className="flex min-h-6 items-center justify-between gap-2 text-xs"
                    >
                      <span className="min-w-0 truncate font-semibold text-foreground">
                        {component.name}
                      </span>
                      <span className="shrink-0 rounded bg-white px-1.5 py-0.5 font-bold text-muted-foreground">
                        x{component.quantity}
                      </span>
                    </div>
                  ))}
                  {hiddenComponentCount > 0 && (
                    <div className="text-xs font-semibold text-muted-foreground">
                      외 {hiddenComponentCount}개
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">세트 구성 정보가 없습니다.</p>
              )}
            </div>
          ) : (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {product.description || "메뉴 설명이 없습니다."}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xl font-bold">{formatPrice(product.price)}원</span>
          <div className="flex items-center gap-2">
            {quantity > 0 && (
              <>
                <QuantityButton label="감소" onClick={onMinus}>
                  <Minus className="h-4 w-4" />
                </QuantityButton>
                <span className="flex h-9 w-10 items-center justify-center rounded-md bg-zinc-100 text-sm font-bold">
                  {quantity}
                </span>
              </>
            )}
            <QuantityButton label="추가" onClick={onPlus} primary disabled={soldOut}>
              <Plus className="h-4 w-4" />
            </QuantityButton>
          </div>
        </div>
      </div>
    </article>
  );
}
