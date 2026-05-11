import { useEffect } from "react";
import { ImageIcon, X } from "lucide-react";
import type { CustomerSaleProduct } from "@/entities/customer-sale-product/model/types";
import { formatPrice } from "../lib/format";

type Props = {
  product: CustomerSaleProduct | null;
  onClose: () => void;
};

export function MenuDetailDialog({ product, onClose }: Props) {
  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const detailDescription = product.detail?.description || product.description;
  const detailItems = [
    { label: "상세 설명", value: detailDescription },
    { label: "원재료", value: product.detail?.ingredients },
    { label: "알레르기 정보", value: product.detail?.allergens },
  ].filter((item) => item.value?.trim());
  const nutritionItems = [
    { label: "열량", value: product.nutrition?.caloriesKcal, unit: "kcal" },
    { label: "탄수화물", value: product.nutrition?.carbohydrateG, unit: "g" },
    { label: "단백질", value: product.nutrition?.proteinG, unit: "g" },
    { label: "지방", value: product.nutrition?.fatG, unit: "g" },
    { label: "나트륨", value: product.nutrition?.sodiumMg, unit: "mg" },
  ].filter((item) => item.value != null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="max-h-[94svh] w-full max-w-[min(96vw,72rem)] overflow-y-auto rounded-lg border border-border bg-background shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="menu-detail-title" className="text-xl font-black tracking-tight">
                {product.name}
              </h2>
              {product.type === "SALE_MENU_SET" ? (
                <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-bold text-muted-foreground">
                  세트
                </span>
              ) : product.category?.name ? (
                <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-bold text-muted-foreground">
                  {product.category.name}
                </span>
              ) : null}
              {product.status === "SOLD_OUT" ? (
                <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-destructive">
                  품절
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-lg font-black">{formatPrice(product.price)}원</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-0 md:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
          <section className="space-y-4 p-5 sm:p-6">
            <div className="h-[min(48svh,25rem)] min-h-64 overflow-hidden rounded-md bg-zinc-100 md:h-[min(50svh,28rem)]">
              {product.imageUrl ? (
                <div
                  aria-label={product.name}
                  className="h-full w-full bg-cover bg-center"
                  role="img"
                  style={{ backgroundImage: `url(${product.imageUrl})` }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-10 w-10" />
                </div>
              )}
            </div>

            {detailItems.length > 0 ? (
              <div className="space-y-3">
                {detailItems.map((item) => (
                  <div key={item.label} className="rounded-md border border-border p-3">
                    <h3 className="text-sm font-black">{item.label}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border p-4 text-sm font-semibold text-muted-foreground">
                등록된 상세 정보가 없습니다.
              </div>
            )}

            {product.type === "SALE_MENU_SET" && product.components.length > 0 ? (
              <div className="rounded-md border border-border p-3">
                <h3 className="text-sm font-black">세트 구성</h3>
                <div className="mt-2 divide-y divide-border">
                  {product.components.map((component) => (
                    <div
                      key={`${component.name}:${component.quantity}`}
                      className="flex items-center justify-between gap-3 py-2 text-sm"
                    >
                      <span className="min-w-0 truncate font-semibold">{component.name}</span>
                      <span className="shrink-0 font-black text-muted-foreground">
                        x{component.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="border-t border-border bg-zinc-50 p-5 sm:p-6 md:border-l md:border-t-0">
            <h3 className="text-base font-black">영양 정보</h3>
            {nutritionItems.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {nutritionItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 rounded-md border border-border bg-background px-3 py-3"
                  >
                    <span className="text-sm font-bold text-muted-foreground">{item.label}</span>
                    <span className="text-base font-black">
                      {item.value?.toLocaleString("ko-KR")}
                      <span className="ml-1 text-xs font-bold text-muted-foreground">{item.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-md border border-dashed border-border bg-background p-4 text-sm font-semibold text-muted-foreground">
                등록된 영양 정보가 없습니다.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
