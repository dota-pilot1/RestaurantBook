"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit2, GripVertical, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saleMenuCategoryApi } from "@/entities/sale-menu-category/api/saleMenuCategoryApi";
import type { SaleMenuCategory } from "@/entities/sale-menu-category/model/types";
import { toast, toastError } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Switch } from "@/shared/ui/Switch";
import { SaleMenuCategoryFormDialog } from "./SaleMenuCategoryFormDialog";

export function SaleMenuCategoryTable() {
  const qc = useQueryClient();
  const [formTarget, setFormTarget] = useState<SaleMenuCategory | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<SaleMenuCategory | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { data: categories, isLoading, isError } = useQuery({
    queryKey: ["sale-menu-categories"],
    queryFn: () => saleMenuCategoryApi.list(),
  });

  const sortedCategories = useMemo(
    () => [...(categories ?? [])].sort(compareCategoryOrder),
    [categories],
  );

  const updateMutation = useMutation({
    mutationFn: (category: SaleMenuCategory) =>
      saleMenuCategoryApi.update(category.id, {
        name: category.name,
        description: category.description,
        visible: !category.visible,
        displayOrder: category.displayOrder,
      }),
    onSuccess: () => {
      toast.success("노출 상태가 변경되었습니다.");
      qc.invalidateQueries({ queryKey: ["sale-menu-categories"] });
    },
    onError: (e) => toastError(e, "노출 상태 변경에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => saleMenuCategoryApi.delete(id),
    onSuccess: () => {
      toast.success("카테고리가 삭제되었습니다.");
      qc.invalidateQueries({ queryKey: ["sale-menu-categories"] });
      setDeleteTarget(null);
    },
    onError: (e) => toastError(e, "삭제에 실패했습니다."),
  });

  const reorderMutation = useMutation({
    mutationFn: (nextCategories: SaleMenuCategory[]) =>
      Promise.all(
        nextCategories.map((category, index) =>
          saleMenuCategoryApi.update(category.id, {
            name: category.name,
            description: category.description,
            visible: category.visible,
            displayOrder: index + 1,
          }),
        ),
      ),
    onMutate: async (nextCategories) => {
      await qc.cancelQueries({ queryKey: ["sale-menu-categories"] });
      const previous = qc.getQueryData<SaleMenuCategory[]>(["sale-menu-categories"]);
      qc.setQueryData<SaleMenuCategory[]>(
        ["sale-menu-categories"],
        nextCategories.map((category, index) => ({ ...category, displayOrder: index + 1 })),
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success("정렬 순서가 저장되었습니다.");
      qc.invalidateQueries({ queryKey: ["sale-menu-categories"] });
    },
    onError: (e, _nextCategories, context) => {
      if (context?.previous) qc.setQueryData(["sale-menu-categories"], context.previous);
      toastError(e, "정렬 순서 저장에 실패했습니다.");
    },
  });

  const isMutating = updateMutation.isPending || deleteMutation.isPending || reorderMutation.isPending;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || reorderMutation.isPending) return;

    const oldIndex = sortedCategories.findIndex((category) => category.id === active.id);
    const newIndex = sortedCategories.findIndex((category) => category.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    reorderMutation.mutate(arrayMove(sortedCategories, oldIndex, newIndex));
  };

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
          카테고리 추가
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <Th className="w-12" />
              <Th>이름</Th>
              <Th>설명</Th>
              <Th>노출</Th>
              <Th>정렬</Th>
              <Th className="text-right">관리</Th>
            </tr>
          </thead>
          <tbody>
            {sortedCategories.length ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedCategories.map((category) => category.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedCategories.map((category, index) => (
                    <SortableCategoryRow
                      key={category.id}
                      category={category}
                      order={index + 1}
                      disabled={isMutating}
                      onToggleVisible={() => updateMutation.mutate(category)}
                      onEdit={() => setFormTarget(category)}
                      onDelete={() => setDeleteTarget(category)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              <tr>
                <Td colSpan={6} className="py-8 text-center text-muted-foreground">
                  등록된 카테고리가 없습니다.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SaleMenuCategoryFormDialog
        open={formTarget !== null}
        category={formTarget === "new" ? null : formTarget}
        onClose={() => setFormTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`'${deleteTarget?.name}' 카테고리를 삭제하시겠습니까?`}
        description="연결된 판매 메뉴가 있으면 삭제할 수 없습니다."
        variant="destructive"
        confirmText="삭제"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

function SortableCategoryRow({
  category,
  order,
  disabled,
  onToggleVisible,
  onEdit,
  onDelete,
}: {
  category: SaleMenuCategory;
  order: number;
  disabled: boolean;
  onToggleVisible: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
    disabled,
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b border-border bg-background last:border-0 hover:bg-muted/20",
        isDragging && "relative z-10 shadow-md",
      )}
    >
      <Td>
        <button
          type="button"
          disabled={disabled}
          className="inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`${category.name} 정렬 순서 변경`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </Td>
      <Td className="font-medium">{category.name}</Td>
      <Td className="max-w-md text-muted-foreground">{category.description || "-"}</Td>
      <Td>
        <Switch
          checked={category.visible}
          disabled={disabled}
          aria-label={`${category.name} 노출 여부`}
          onCheckedChange={onToggleVisible}
        />
      </Td>
      <Td className="text-muted-foreground">{order}</Td>
      <Td>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onEdit}
            disabled={disabled}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-accent disabled:opacity-50"
            aria-label={`${category.name} 수정`}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={disabled}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/50 text-destructive hover:bg-destructive/10 disabled:opacity-50"
            aria-label={`${category.name} 삭제`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </Td>
    </tr>
  );
}

function compareCategoryOrder(a: SaleMenuCategory, b: SaleMenuCategory) {
  return a.displayOrder - b.displayOrder || a.id - b.id;
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 text-left text-xs font-medium text-muted-foreground ${className}`}>{children}</th>;
}

function Td({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={`px-4 py-2.5 ${className}`}>{children}</td>;
}
