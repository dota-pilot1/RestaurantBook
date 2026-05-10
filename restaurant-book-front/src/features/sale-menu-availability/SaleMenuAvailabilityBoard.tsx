"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saleMenuApi } from "@/entities/sale-menu/api/saleMenuApi";
import type { SaleMenu, SaleMenuStatus } from "@/entities/sale-menu/model/types";
import { saleMenuCategoryApi } from "@/entities/sale-menu-category/api/saleMenuCategoryApi";
import { toast, toastError } from "@/shared/lib/toast";
import { Switch } from "@/shared/ui/Switch";

const STATUS_LABEL: Record<SaleMenuStatus, string> = {
  ACTIVE: "판매중",
  SOLD_OUT: "품절",
  HIDDEN: "숨김",
};

const STATUS_CLASS: Record<SaleMenuStatus, string> = {
  ACTIVE: "bg-emerald-600 text-white",
  SOLD_OUT: "bg-amber-500 text-white",
  HIDDEN: "bg-slate-600 text-white",
};

export function SaleMenuAvailabilityBoard() {
  const qc = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");

  const { data: categories = [] } = useQuery({
    queryKey: ["sale-menu-categories"],
    queryFn: () => saleMenuCategoryApi.list(),
  });

  const { data: menus = [], isLoading, isError } = useQuery({
    queryKey: ["sale-menus", "availability"],
    queryFn: () => saleMenuApi.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ menu, patch }: { menu: SaleMenu; patch: Partial<SaleMenu> }) => {
      if (!menu.category) {
        throw new Error("categoryId is required");
      }
      return saleMenuApi.update(menu.id, {
        categoryId: menu.category.id,
        name: menu.name,
        description: menu.description,
        price: menu.price,
        imageUrl: menu.imageUrl,
        status: patch.status ?? menu.status,
        visible: patch.visible ?? menu.visible,
        availableDineIn: patch.availableDineIn ?? menu.availableDineIn,
        availableTakeout: patch.availableTakeout ?? menu.availableTakeout,
        requiresCooking: menu.requiresCooking,
        displayOrder: menu.displayOrder,
      });
    },
    onSuccess: () => {
      toast.success("상태가 변경되었습니다.");
      qc.invalidateQueries({ queryKey: ["sale-menus"] });
    },
    onError: (e) => toastError(e, "상태 변경에 실패했습니다."),
  });

  const visibleMenus = useMemo(() => {
    if (selectedCategoryId === "all") return menus;
    return menus.filter((menu) => menu.category?.id === selectedCategoryId);
  }, [menus, selectedCategoryId]);

  if (isLoading) return <p className="text-sm text-muted-foreground">로딩 중...</p>;
  if (isError) return <p className="text-sm text-destructive">데이터를 불러오지 못했습니다.</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto border-b border-border pb-2">
        <Tab active={selectedCategoryId === "all"} onClick={() => setSelectedCategoryId("all")}>전체</Tab>
        {categories.map((category) => (
          <Tab key={category.id} active={selectedCategoryId === category.id} onClick={() => setSelectedCategoryId(category.id)}>
            {category.name}
          </Tab>
        ))}
      </div>

      <div className="grid gap-3">
        {visibleMenus.length ? visibleMenus.map((menu) => (
          <div key={menu.id} className="grid gap-4 rounded-lg border border-border p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-sm font-semibold">{menu.name}</h2>
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{menu.category?.name ?? "카테고리 없음"}</span>
                {!menu.visible && <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">미노출</span>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{menu.price.toLocaleString("ko-KR")}원</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 md:justify-end">
              <div className="flex flex-wrap items-center gap-2 md:border-r md:border-border md:pr-6">
                {(["ACTIVE", "SOLD_OUT", "HIDDEN"] as SaleMenuStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={updateMutation.isPending || menu.status === status}
                    onClick={() => updateMutation.mutate({ menu, patch: { status } })}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-100 ${
                      menu.status === status ? STATUS_CLASS[status] : "border border-input bg-background hover:bg-accent"
                    }`}
                  >
                    {STATUS_LABEL[status]}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <Toggle
                  label="노출"
                  checked={menu.visible}
                  disabled={updateMutation.isPending}
                  onChange={(visible) => updateMutation.mutate({ menu, patch: { visible } })}
                />
                <Toggle
                  label="매장"
                  checked={menu.availableDineIn}
                  disabled={updateMutation.isPending}
                  onChange={(availableDineIn) => updateMutation.mutate({ menu, patch: { availableDineIn } })}
                />
                <Toggle
                  label="포장"
                  checked={menu.availableTakeout}
                  disabled={updateMutation.isPending}
                  onChange={(availableTakeout) => updateMutation.mutate({ menu, patch: { availableTakeout } })}
                />
              </div>
            </div>
          </div>
        )) : (
          <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
            등록된 판매 메뉴가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium ${active ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
    >
      {children}
    </button>
  );
}

function Toggle({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
