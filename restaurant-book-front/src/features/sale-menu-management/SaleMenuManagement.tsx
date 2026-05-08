"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FolderTree, Plus, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saleMenuApi } from "@/entities/sale-menu/api/saleMenuApi";
import type { SaleMenu, SaleMenuFilters, SaleMenuStatus } from "@/entities/sale-menu/model/types";
import { saleMenuCategoryApi } from "@/entities/sale-menu-category/api/saleMenuCategoryApi";
import { toast, toastError } from "@/shared/lib/toast";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { SelectInput } from "@/shared/ui/SelectInput";
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

  const sortedMenus = useMemo(
    () => [...menus].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id),
    [menus],
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

  const isMutating = updateMutation.isPending || bulkUpdateMutation.isPending || bulkDeleteMutation.isPending;

  if (isLoading) return <p className="text-sm text-muted-foreground">로딩 중...</p>;
  if (isError) return <p className="text-sm text-destructive">데이터를 불러오지 못했습니다.</p>;

  return (
    <>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
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
      />

      <SaleMenuFormDialog
        open={formTarget !== null}
        menu={formTarget === "new" ? null : formTarget}
        categories={categories}
        onClose={() => setFormTarget(null)}
      />

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
  return {
    categoryId: menu.category?.id ?? null,
    name: menu.name,
    description: menu.description,
    price: menu.price,
    imageUrl: menu.imageUrl,
    status: patch.status ?? menu.status,
    visible: patch.visible ?? menu.visible,
    availableDineIn: patch.availableDineIn ?? menu.availableDineIn,
    availableTakeout: patch.availableTakeout ?? menu.availableTakeout,
    requiresCooking: patch.requiresCooking ?? menu.requiresCooking,
    displayOrder: menu.displayOrder,
  };
}
