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
import { restaurantTableApi } from "@/entities/restaurant-table/api/restaurantTableApi";
import type { RestaurantTable } from "@/entities/restaurant-table/model/types";
import { toast, toastError } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Switch } from "@/shared/ui/Switch";
import { TableFormDialog } from "./TableFormDialog";

export function TableManagement() {
  const qc = useQueryClient();
  const [formTarget, setFormTarget] = useState<RestaurantTable | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<RestaurantTable | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { data: tables, isLoading, isError } = useQuery({
    queryKey: ["restaurant-tables"],
    queryFn: () => restaurantTableApi.list(),
  });

  const sortedTables = useMemo(
    () => [...(tables ?? [])].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id),
    [tables],
  );

  const toggleMutation = useMutation({
    mutationFn: (t: RestaurantTable) =>
      restaurantTableApi.update(t.id, { name: t.name, active: !t.active, displayOrder: t.displayOrder }),
    onSuccess: () => {
      toast.success("사용 상태가 변경되었습니다.");
      qc.invalidateQueries({ queryKey: ["restaurant-tables"] });
      qc.invalidateQueries({ queryKey: ["restaurant-tables-active"] });
    },
    onError: (e) => toastError(e, "상태 변경에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => restaurantTableApi.delete(id),
    onSuccess: () => {
      toast.success("테이블이 삭제되었습니다.");
      qc.invalidateQueries({ queryKey: ["restaurant-tables"] });
      qc.invalidateQueries({ queryKey: ["restaurant-tables-active"] });
      setDeleteTarget(null);
    },
    onError: (e) => toastError(e, "삭제에 실패했습니다."),
  });

  const reorderMutation = useMutation({
    mutationFn: (next: RestaurantTable[]) =>
      Promise.all(
        next.map((t, index) =>
          restaurantTableApi.update(t.id, { name: t.name, active: t.active, displayOrder: index + 1 }),
        ),
      ),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: ["restaurant-tables"] });
      const previous = qc.getQueryData<RestaurantTable[]>(["restaurant-tables"]);
      qc.setQueryData<RestaurantTable[]>(
        ["restaurant-tables"],
        next.map((t, index) => ({ ...t, displayOrder: index + 1 })),
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success("정렬 순서가 저장되었습니다.");
      qc.invalidateQueries({ queryKey: ["restaurant-tables"] });
      qc.invalidateQueries({ queryKey: ["restaurant-tables-active"] });
    },
    onError: (e, _next, context) => {
      if (context?.previous) qc.setQueryData(["restaurant-tables"], context.previous);
      toastError(e, "정렬 순서 저장에 실패했습니다.");
    },
  });

  const isMutating = toggleMutation.isPending || deleteMutation.isPending || reorderMutation.isPending;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || reorderMutation.isPending) return;
    const oldIndex = sortedTables.findIndex((t) => t.id === active.id);
    const newIndex = sortedTables.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    reorderMutation.mutate(arrayMove(sortedTables, oldIndex, newIndex));
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
          테이블 추가
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <Th className="w-12" />
                <Th>테이블 이름</Th>
                <Th>사용 중</Th>
                <Th className="text-right">관리</Th>
              </tr>
            </thead>
            <tbody>
              {sortedTables.length ? (
                <SortableContext
                  items={sortedTables.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedTables.map((t) => (
                    <SortableTableRow
                      key={t.id}
                      table={t}
                      disabled={isMutating}
                      onToggleActive={() => toggleMutation.mutate(t)}
                      onEdit={() => setFormTarget(t)}
                      onDelete={() => setDeleteTarget(t)}
                    />
                  ))}
                </SortableContext>
              ) : (
                <tr>
                  <Td colSpan={4} className="py-8 text-center text-muted-foreground">
                    등록된 테이블이 없습니다.
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </DndContext>
      </div>

      <TableFormDialog
        open={formTarget !== null}
        table={formTarget === "new" ? null : formTarget}
        onClose={() => setFormTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`'${deleteTarget?.name}' 테이블을 삭제하시겠습니까?`}
        description="삭제된 테이블은 복구할 수 없습니다."
        variant="destructive"
        confirmText="삭제"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

function SortableTableRow({
  table, disabled, onToggleActive, onEdit, onDelete,
}: {
  table: RestaurantTable;
  disabled: boolean;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: table.id,
    disabled,
  });
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition };

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
          aria-label={`${table.name} 정렬 이동`}
          className="inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </Td>
      <Td className="font-medium">{table.name}</Td>
      <Td>
        <Switch
          checked={table.active}
          disabled={disabled}
          aria-label={`${table.name} 사용 상태 변경`}
          onCheckedChange={onToggleActive}
        />
      </Td>
      <Td>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onEdit}
            disabled={disabled}
            aria-label={`${table.name} 수정`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-accent disabled:opacity-50"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={disabled}
            aria-label={`${table.name} 삭제`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/50 text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </Td>
    </tr>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 text-left text-xs font-medium text-muted-foreground ${className}`}>{children}</th>;
}

function Td({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={`px-4 py-2.5 ${className}`}>{children}</td>;
}
