"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

  if (isLoading) return <p className="text-sm text-muted-foreground">로딩 중...</p>;
  if (isError) return <p className="text-sm text-destructive">데이터를 불러오지 못했습니다.</p>;

  return (
    <>
      <div className="mb-4 flex justify-end">
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
