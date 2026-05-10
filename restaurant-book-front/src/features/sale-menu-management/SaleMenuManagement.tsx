"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Download, FolderTree, Plus, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saleMenuApi } from "@/entities/sale-menu/api/saleMenuApi";
import type { SaleMenu, SaleMenuFilters, SaleMenuStatus } from "@/entities/sale-menu/model/types";
import { saleMenuCategoryApi } from "@/entities/sale-menu-category/api/saleMenuCategoryApi";
import { toast, toastError } from "@/shared/lib/toast";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { SelectInput } from "@/shared/ui/SelectInput";
import { SaleMenuCategoryTabs } from "./SaleMenuCategoryTabs";
import { SaleMenuFilters as SaleMenuFiltersPanel } from "./SaleMenuFilters";
import { SaleMenuFormDialog } from "./SaleMenuFormDialog";
import { SaleMenuTable } from "./SaleMenuTable";

export function SaleMenuManagement() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<SaleMenuFilters>({});
  const [formTarget, setFormTarget] = useState<SaleMenu | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<SaleMenu | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  const cleanFilters = useMemo(() => ({
    ...filters,
    keyword: filters.keyword?.trim() || undefined,
  }), [filters]);

  const { data: categories = [] } = useQuery({
    queryKey: ["sale-menu-categories"],
    queryFn: () => saleMenuCategoryApi.list(),
  });

  const { data: menus = [], isLoading, isError } = useQuery({
    queryKey: ["sale-menus", cleanFilters],
    queryFn: () => saleMenuApi.list(cleanFilters),
  });

  const { data: allMenus = [] } = useQuery({
    queryKey: ["sale-menus", "category-counts"],
    queryFn: () => saleMenuApi.list(),
  });

  const categoryOrderMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.displayOrder])),
    [categories],
  );

  const sortedMenus = useMemo(
    () => [...menus].sort((a, b) => {
      const aCategoryOrder = a.category ? categoryOrderMap.get(a.category.id) ?? 999999 : 999999;
      const bCategoryOrder = b.category ? categoryOrderMap.get(b.category.id) ?? 999999 : 999999;
      return aCategoryOrder - bCategoryOrder || a.displayOrder - b.displayOrder || a.id - b.id;
    }),
    [categoryOrderMap, menus],
  );

  const selectedMenus = useMemo(
    () => sortedMenus.filter((menu) => selectedIds.has(menu.id)),
    [sortedMenus, selectedIds],
  );
  const allSelected = sortedMenus.length > 0 && selectedIds.size === sortedMenus.length;
  const someSelected = selectedIds.size > 0;

  useEffect(() => {
    setSelectedIds((prev) => {
      const visibleIds = new Set(sortedMenus.map((menu) => menu.id));
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [sortedMenus]);

  const updateMutation = useMutation({
    mutationFn: ({ menu, patch }: { menu: SaleMenu; patch: Partial<SaleMenu> }) =>
      saleMenuApi.update(menu.id, toUpdateBody(menu, patch)),
    onSuccess: () => {
      toast.success("판매 메뉴가 변경되었습니다.");
      qc.invalidateQueries({ queryKey: ["sale-menus"] });
    },
    onError: (e) => toastError(e, "변경에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => saleMenuApi.delete(id),
    onSuccess: () => {
      toast.success("판매 메뉴가 삭제되었습니다.");
      qc.invalidateQueries({ queryKey: ["sale-menus"] });
      setDeleteTarget(null);
    },
    onError: (e) => toastError(e, "삭제에 실패했습니다."),
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ menus, patch }: { menus: SaleMenu[]; patch: Partial<SaleMenu> }) =>
      Promise.all(menus.map((menu) => saleMenuApi.update(menu.id, toUpdateBody(menu, patch)))),
    onSuccess: (_, { menus }) => {
      toast.success(`${menus.length}개 판매 메뉴가 변경되었습니다.`);
      qc.invalidateQueries({ queryKey: ["sale-menus"] });
      setSelectedIds(new Set());
    },
    onError: (e) => toastError(e, "일괄 변경에 실패했습니다."),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (menus: SaleMenu[]) => Promise.all(menus.map((menu) => saleMenuApi.delete(menu.id))),
    onSuccess: (_, menus) => {
      toast.success(`${menus.length}개 판매 메뉴가 삭제되었습니다.`);
      qc.invalidateQueries({ queryKey: ["sale-menus"] });
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
    },
    onError: (e) => toastError(e, "일괄 삭제에 실패했습니다."),
  });

  const reorderMutation = useMutation({
    mutationFn: (nextMenus: SaleMenu[]) =>
      Promise.all(
        nextMenus.map((menu, index) => saleMenuApi.update(menu.id, toUpdateBody(menu, { displayOrder: index }))),
      ),
    onMutate: async (nextMenus) => {
      await qc.cancelQueries({ queryKey: ["sale-menus", cleanFilters] });
      const previous = qc.getQueryData<SaleMenu[]>(["sale-menus", cleanFilters]);
      qc.setQueryData<SaleMenu[]>(
        ["sale-menus", cleanFilters],
        nextMenus.map((menu, index) => ({ ...menu, displayOrder: index })),
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success("메뉴 순서가 저장되었습니다.");
      qc.invalidateQueries({ queryKey: ["sale-menus"] });
      qc.invalidateQueries({ queryKey: ["customer-sale-products"] });
    },
    onError: (e, _nextMenus, context) => {
      if (context?.previous) qc.setQueryData(["sale-menus", cleanFilters], context.previous);
      toastError(e, "메뉴 순서 저장에 실패했습니다.");
    },
  });

  const isMutating =
    updateMutation.isPending ||
    bulkUpdateMutation.isPending ||
    bulkDeleteMutation.isPending ||
    reorderMutation.isPending;
  const canReorderMenus =
    typeof cleanFilters.categoryId === "number" &&
    !cleanFilters.keyword &&
    !cleanFilters.status &&
    cleanFilters.visible === undefined;

  const handleDownloadExcel = async () => {
    if (!sortedMenus.length) return;

    setIsDownloadingExcel(true);
    try {
      const { utils, writeFile } = await import("xlsx");
      const rows = sortedMenus.map((menu) => ({
        ID: menu.id,
        메뉴명: menu.name,
        설명: menu.description ?? "",
        카테고리: menu.category?.name ?? "미분류",
        "가격(원)": menu.price,
        "판매 상태": EXCEL_STATUS_LABEL[menu.status],
        "매장 주문": menu.availableDineIn ? "가능" : "불가",
        "포장 주문": menu.availableTakeout ? "가능" : "불가",
        "조리 필요": menu.requiresCooking ? "필요" : "불필요",
        "고객 노출": menu.visible ? "노출" : "미노출",
        "정렬 순서": menu.displayOrder,
        "이미지 URL": menu.imageUrl ?? "",
        생성일: formatExcelDateTime(menu.createdAt),
        수정일: formatExcelDateTime(menu.updatedAt),
      }));

      const ws = utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 8 },
        { wch: 20 },
        { wch: 32 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 48 },
        { wch: 20 },
        { wch: 20 },
      ];

      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "판매메뉴");
      writeFile(wb, `판매메뉴_${formatDownloadTimestamp(new Date())}.xlsx`);
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
            disabled={isDownloadingExcel || sortedMenus.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isDownloadingExcel ? "다운로드 중..." : "엑셀 다운로드"}
          </button>
          <Link
            href="/sale-menu-categories"
            className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            <FolderTree className="h-4 w-4" />
            카테고리 관리
          </Link>
          <button
            type="button"
            onClick={() => setFormTarget("new")}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            메뉴 추가
          </button>
      </div>

      <SaleMenuFiltersPanel filters={filters} categories={categories} onChange={setFilters} />
      <BulkActionBar
        selectedCount={selectedMenus.length}
        disabled={isMutating}
        onClear={() => setSelectedIds(new Set())}
        onStatusChange={(status) => bulkUpdateMutation.mutate({ menus: selectedMenus, patch: { status } })}
        onVisibleChange={(visible) => bulkUpdateMutation.mutate({ menus: selectedMenus, patch: { visible } })}
        onDelete={() => setBulkDeleteOpen(true)}
      />
      <SaleMenuTable
        menus={sortedMenus}
        isUpdating={isMutating}
        reorderEnabled={canReorderMenus}
        toolbarContent={
          <SaleMenuCategoryTabs
            categories={categories}
            menus={allMenus}
            selectedCategoryId={filters.categoryId}
            onSelect={(categoryId) => {
              setSelectedIds(new Set());
              setFilters((prev) => ({ ...prev, categoryId }));
            }}
          />
        }
        selectedIds={selectedIds}
        allSelected={allSelected}
        someSelected={someSelected}
        onToggleAll={(checked) => setSelectedIds(checked ? new Set(sortedMenus.map((menu) => menu.id)) : new Set())}
        onToggleOne={(menuId, checked) => {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            if (checked) next.add(menuId);
            else next.delete(menuId);
            return next;
          });
        }}
        onEdit={setFormTarget}
        onDelete={setDeleteTarget}
        onQuickUpdate={(menu, patch) => updateMutation.mutate({ menu, patch })}
        onReorder={(nextMenus) => reorderMutation.mutate(nextMenus)}
      />

      {formTarget !== null && (
        <SaleMenuFormDialog
          key={formTarget === "new" ? "new" : formTarget.id}
          open={true}
          menu={formTarget === "new" ? null : formTarget}
          categories={categories}
          onClose={() => setFormTarget(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={`'${deleteTarget?.name}' 판매 메뉴를 삭제하시겠습니까?`}
        description="MVP에서는 판매 메뉴가 물리 삭제됩니다."
        variant="destructive"
        confirmText="삭제"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`${selectedMenus.length}개 판매 메뉴를 삭제하시겠습니까?`}
        description="선택한 판매 메뉴가 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
        variant="destructive"
        confirmText="삭제"
        loading={bulkDeleteMutation.isPending}
        onConfirm={() => bulkDeleteMutation.mutate(selectedMenus)}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </>
  );
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

function BulkActionBar({
  selectedCount,
  disabled,
  onClear,
  onStatusChange,
  onVisibleChange,
  onDelete,
}: {
  selectedCount: number;
  disabled: boolean;
  onClear: () => void;
  onStatusChange: (status: SaleMenuStatus) => void;
  onVisibleChange: (visible: boolean) => void;
  onDelete: () => void;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{selectedCount}개 선택됨</span>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-60"
        >
          <X className="h-3.5 w-3.5" />
          선택 해제
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SelectInput
          value=""
          disabled={disabled}
          onValueChange={(value) => value && onStatusChange(value as SaleMenuStatus)}
          options={[
            { value: "", label: "상태 변경" },
            { value: "ACTIVE", label: "판매중" },
            { value: "SOLD_OUT", label: "품절" },
            { value: "HIDDEN", label: "숨김" },
          ]}
          aria-label="선택 메뉴 상태 일괄 변경"
          size="sm"
          className="w-32 bg-background"
        />
        <button
          type="button"
          onClick={() => onVisibleChange(true)}
          disabled={disabled}
          className="h-8 rounded-md border border-border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-60"
        >
          노출
        </button>
        <button
          type="button"
          onClick={() => onVisibleChange(false)}
          disabled={disabled}
          className="h-8 rounded-md border border-border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-60"
        >
          미노출
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-destructive/40 bg-background px-2.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" />
          삭제
        </button>
      </div>
    </div>
  );
}

function toUpdateBody(menu: SaleMenu, patch: Partial<SaleMenu>) {
  if (!menu.category) {
    throw new Error("categoryId is required");
  }
  return {
    categoryId: menu.category.id,
    name: menu.name,
    description: menu.description,
    price: menu.price,
    imageUrl: menu.imageUrl,
    status: patch.status ?? menu.status,
    visible: patch.visible ?? menu.visible,
    availableDineIn: patch.availableDineIn ?? menu.availableDineIn,
    availableTakeout: patch.availableTakeout ?? menu.availableTakeout,
    requiresCooking: patch.requiresCooking ?? menu.requiresCooking,
    displayOrder: patch.displayOrder ?? menu.displayOrder,
  };
}
