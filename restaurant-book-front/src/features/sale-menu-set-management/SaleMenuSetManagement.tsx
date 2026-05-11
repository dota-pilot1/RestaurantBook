"use client";

import { useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SaleMenuStatus } from "@/entities/sale-menu/model/types";
import { saleMenuSetApi } from "@/entities/sale-menu-set/api/saleMenuSetApi";
import type { SaleMenuSet, SaleMenuSetFilters } from "@/entities/sale-menu-set/model/types";
import { toast, toastError } from "@/shared/lib/toast";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { SaleMenuSetFilters as SaleMenuSetFiltersPanel } from "./SaleMenuSetFilters";
import { SaleMenuSetFormDialog } from "./SaleMenuSetFormDialog";
import { SaleMenuSetTable } from "./SaleMenuSetTable";

export function SaleMenuSetManagement() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<SaleMenuSetFilters>({});
  const [formTarget, setFormTarget] = useState<SaleMenuSet | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<SaleMenuSet | null>(null);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  const cleanFilters = useMemo(() => ({
    ...filters,
    keyword: filters.keyword?.trim() || undefined,
  }), [filters]);

  const { data: sets = [], isLoading, isError } = useQuery({
    queryKey: ["sale-menu-sets", cleanFilters],
    queryFn: () => saleMenuSetApi.list(cleanFilters),
  });

  const sortedSets = useMemo(
    () => [...sets].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id),
    [sets],
  );

  const updateMutation = useMutation({
    mutationFn: ({ set, patch }: { set: SaleMenuSet; patch: Partial<SaleMenuSet> }) =>
      saleMenuSetApi.update(set.id, toUpdateBody(set, patch)),
    onSuccess: () => {
      toast.success("세트 메뉴가 변경되었습니다.");
      qc.invalidateQueries({ queryKey: ["sale-menu-sets"] });
    },
    onError: (e) => toastError(e, "변경에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => saleMenuSetApi.delete(id),
    onSuccess: () => {
      toast.success("세트 메뉴가 삭제되었습니다.");
      qc.invalidateQueries({ queryKey: ["sale-menu-sets"] });
      setDeleteTarget(null);
    },
    onError: (e) => toastError(e, "삭제에 실패했습니다."),
  });

  const handleDownloadExcel = async () => {
    if (!sortedSets.length) return;

    setIsDownloadingExcel(true);
    try {
      const { utils, writeFile } = await import("xlsx");
      const rows = sortedSets.map((set) => ({
        ID: set.id,
        세트명: set.name,
        설명: set.description ?? "",
        구성: set.items.map((item) => `${item.saleMenu.name} x${item.quantity}`).join(", "),
        "가격(원)": set.price,
        "판매 상태": EXCEL_STATUS_LABEL[set.status],
        "매장 주문": set.availableDineIn ? "가능" : "불가",
        "포장 주문": set.availableTakeout ? "가능" : "불가",
        "고객 노출": set.visible ? "노출" : "미노출",
        "정렬 순서": set.displayOrder,
        "이미지 URL": set.imageUrl ?? "",
        생성일: formatExcelDateTime(set.createdAt),
        수정일: formatExcelDateTime(set.updatedAt),
      }));

      const ws = utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 8 },
        { wch: 20 },
        { wch: 32 },
        { wch: 48 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 48 },
        { wch: 20 },
        { wch: 20 },
      ];

      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "세트메뉴");
      writeFile(wb, `세트메뉴_${formatDownloadTimestamp(new Date())}.xlsx`);
      toast.success("엑셀 파일을 다운로드했습니다.");
    } catch (e) {
      toastError(e, "엑셀 다운로드에 실패했습니다.");
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">로딩 중...</p>;
  if (isError) return <p className="text-sm text-destructive">데이터를 불러오지 못했습니다.</p>;

  return (
    <>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={handleDownloadExcel}
          disabled={isDownloadingExcel || sortedSets.length === 0}
          className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {isDownloadingExcel ? "다운로드 중..." : "엑셀 다운로드"}
        </button>
        <button
          type="button"
          onClick={() => setFormTarget("new")}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          세트 추가
        </button>
      </div>

      <SaleMenuSetFiltersPanel filters={filters} onChange={setFilters} />
      <SaleMenuSetTable
        sets={sortedSets}
        isUpdating={updateMutation.isPending}
        onEdit={setFormTarget}
        onDelete={setDeleteTarget}
        onQuickUpdate={(set, patch) => updateMutation.mutate({ set, patch })}
      />

      <SaleMenuSetFormDialog
        open={formTarget !== null}
        saleMenuSet={formTarget === "new" ? null : formTarget}
        onClose={() => setFormTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`'${deleteTarget?.name}' 세트 메뉴를 삭제하시겠습니까?`}
        description="세트 상품과 구성 품목이 함께 삭제됩니다."
        variant="destructive"
        confirmText="삭제"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

function toUpdateBody(set: SaleMenuSet, patch: Partial<SaleMenuSet>) {
  const next = { ...set, ...patch };
  return {
    name: next.name,
    description: next.description,
    detailDescription: next.detailDescription,
    ingredients: next.ingredients,
    allergens: next.allergens,
    caloriesKcal: next.caloriesKcal,
    carbohydrateG: next.carbohydrateG,
    proteinG: next.proteinG,
    fatG: next.fatG,
    sodiumMg: next.sodiumMg,
    price: next.price,
    imageUrl: next.imageUrl,
    status: next.status,
    visible: next.visible,
    availableDineIn: next.availableDineIn,
    availableTakeout: next.availableTakeout,
    displayOrder: next.displayOrder,
    items: next.items.map((item) => ({
      saleMenuId: item.saleMenu.id,
      quantity: item.quantity,
      displayOrder: item.displayOrder,
    })),
  };
}

const EXCEL_STATUS_LABEL: Record<SaleMenuStatus, string> = {
  ACTIVE: "판매중",
  SOLD_OUT: "품절",
  HIDDEN: "숨김",
};

function formatDownloadTimestamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "_",
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join("");
}

function formatExcelDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
