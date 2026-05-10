"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useState } from "react";
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
import { Edit2, GripVertical, ImageIcon, LayoutGrid, Table2, Trash2 } from "lucide-react";
import type { SaleMenu, SaleMenuStatus } from "@/entities/sale-menu/model/types";
import { Checkbox } from "@/shared/ui/Checkbox";
import { SelectInput } from "@/shared/ui/SelectInput";
import { Switch } from "@/shared/ui/Switch";
import { ViewToggle } from "@/shared/ui/ViewToggle";

type Props = {
  menus: SaleMenu[];
  isUpdating: boolean;
  reorderEnabled: boolean;
  toolbarContent?: React.ReactNode;
  selectedIds: Set<number>;
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: (checked: boolean) => void;
  onToggleOne: (menuId: number, checked: boolean) => void;
  onEdit: (menu: SaleMenu) => void;
  onDelete: (menu: SaleMenu) => void;
  onQuickUpdate: (menu: SaleMenu, patch: Partial<SaleMenu>) => void;
  onReorder: (menus: SaleMenu[]) => void;
};

const STATUS_LABEL: Record<SaleMenuStatus, string> = {
  ACTIVE: "판매중",
  SOLD_OUT: "품절",
  HIDDEN: "숨김",
};

const STATUS_CLASS: Record<SaleMenuStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  SOLD_OUT: "bg-amber-50 text-amber-700",
  HIDDEN: "bg-slate-100 text-slate-600",
};

type ViewMode = "table" | "card";

export function SaleMenuTable({
  menus,
  isUpdating,
  reorderEnabled,
  toolbarContent,
  selectedIds,
  allSelected,
  someSelected,
  onToggleAll,
  onToggleOne,
  onEdit,
  onDelete,
  onQuickUpdate,
  onReorder,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!reorderEnabled || !over || active.id === over.id || isUpdating) return;

    const oldIndex = menus.findIndex((menu) => menu.id === active.id);
    const newIndex = menus.findIndex((menu) => menu.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    onReorder(arrayMove(menus, oldIndex, newIndex));
  };

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {toolbarContent}
          {viewMode === "card" ? (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected && !allSelected}
                disabled={!menus.length || isUpdating}
                aria-label="전체 메뉴 선택"
                onCheckedChange={onToggleAll}
              />
              <span className="text-sm font-medium">전체 선택</span>
            </div>
          ) : (
            <span />
          )}
        </div>
        <ViewToggle<ViewMode>
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: "table", icon: Table2, label: "테이블" },
            { value: "card", icon: LayoutGrid, label: "카드" },
          ]}
        />
      </div>

      {viewMode === "table" && reorderEnabled && (
        <p className="mb-2 text-xs text-muted-foreground">
          드래그해서 선택한 카테고리 안의 메뉴 순서를 변경할 수 있습니다.
        </p>
      )}

      {viewMode === "card" ? (
        menus.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {menus.map((menu) => (
              <SaleMenuCard
                key={menu.id}
                menu={menu}
                selected={selectedIds.has(menu.id)}
                isUpdating={isUpdating}
                onToggleOne={onToggleOne}
                onEdit={onEdit}
                onDelete={onDelete}
                onQuickUpdate={onQuickUpdate}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border py-8 text-center text-sm text-muted-foreground">
            등록된 판매 메뉴가 없습니다.
          </div>
        )
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[1080px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {reorderEnabled && <Th className="w-10" />}
                  <Th className="w-10">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected && !allSelected}
                      disabled={!menus.length || isUpdating}
                      aria-label="전체 메뉴 선택"
                      onCheckedChange={onToggleAll}
                    />
                  </Th>
                  <Th>이미지</Th>
                  <Th>메뉴명</Th>
                  <Th>카테고리</Th>
                  <Th>가격</Th>
                  <Th>상태</Th>
                  <Th>주문 유형</Th>
                  <Th>조리</Th>
                  <Th>노출</Th>
                  <Th>정렬</Th>
                  <Th className="text-right">관리</Th>
                </tr>
              </thead>
              <tbody>
                {menus.length ? (
                  reorderEnabled ? (
                    <SortableContext items={menus.map((menu) => menu.id)} strategy={verticalListSortingStrategy}>
                      {menus.map((menu) => (
                        <SortableMenuRow
                          key={menu.id}
                          menu={menu}
                          selected={selectedIds.has(menu.id)}
                          disabled={isUpdating}
                          onToggleOne={onToggleOne}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onQuickUpdate={onQuickUpdate}
                        />
                      ))}
                    </SortableContext>
                  ) : (
                    menus.map((menu) => (
                      <MenuRow
                        key={menu.id}
                        menu={menu}
                        selected={selectedIds.has(menu.id)}
                        disabled={isUpdating}
                        onToggleOne={onToggleOne}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onQuickUpdate={onQuickUpdate}
                      />
                    ))
                  )
                ) : (
                  <tr>
                    <Td colSpan={reorderEnabled ? 12 : 11} className="py-8 text-center text-muted-foreground">
                      등록된 판매 메뉴가 없습니다.
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DndContext>
      )}
    </>
  );
}

function SortableMenuRow({
  menu,
  selected,
  disabled,
  onToggleOne,
  onEdit,
  onDelete,
  onQuickUpdate,
}: {
  menu: SaleMenu;
  selected: boolean;
  disabled: boolean;
  onToggleOne: (menuId: number, checked: boolean) => void;
  onEdit: (menu: SaleMenu) => void;
  onDelete: (menu: SaleMenu) => void;
  onQuickUpdate: (menu: SaleMenu, patch: Partial<SaleMenu>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: menu.id,
    disabled,
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <MenuRow
      rowRef={setNodeRef}
      style={style}
      menu={menu}
      selected={selected}
      disabled={disabled}
      dragging={isDragging}
      dragHandle={
        <button
          type="button"
          disabled={disabled}
          className="inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`${menu.name} 순서 변경`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      }
      onToggleOne={onToggleOne}
      onEdit={onEdit}
      onDelete={onDelete}
      onQuickUpdate={onQuickUpdate}
    />
  );
}

function MenuRow({
  menu,
  selected,
  disabled,
  dragging = false,
  dragHandle,
  style,
  rowRef,
  onToggleOne,
  onEdit,
  onDelete,
  onQuickUpdate,
}: {
  menu: SaleMenu;
  selected: boolean;
  disabled: boolean;
  dragging?: boolean;
  dragHandle?: React.ReactNode;
  style?: CSSProperties;
  rowRef?: (node: HTMLTableRowElement | null) => void;
  onToggleOne: (menuId: number, checked: boolean) => void;
  onEdit: (menu: SaleMenu) => void;
  onDelete: (menu: SaleMenu) => void;
  onQuickUpdate: (menu: SaleMenu, patch: Partial<SaleMenu>) => void;
}) {
  return (
    <tr
      ref={rowRef}
      style={style}
      className={`border-b border-border bg-background last:border-0 hover:bg-muted/20 ${
        selected ? "bg-primary/5" : ""
      } ${dragging ? "relative z-10 shadow-md" : ""}`}
    >
      {dragHandle && <Td>{dragHandle}</Td>}
      <Td>
        <Checkbox
          checked={selected}
          disabled={disabled}
          aria-label={`${menu.name} 선택`}
          onCheckedChange={(checked) => onToggleOne(menu.id, checked)}
        />
      </Td>
      <Td>
        <MenuImage menu={menu} size="sm" />
      </Td>
      <Td>
        <div className="max-w-[260px]">
          <p className="font-medium">{menu.name}</p>
          <p className="mt-1 truncate text-sm text-foreground/70">{menu.description || "-"}</p>
        </div>
      </Td>
      <Td>{menu.category?.name ?? "-"}</Td>
      <Td className="font-medium">{menu.price.toLocaleString("ko-KR")}원</Td>
      <Td>
        <StatusSelect menu={menu} disabled={disabled} onQuickUpdate={onQuickUpdate} />
      </Td>
      <Td>
        <OrderTypeBadges menu={menu} />
      </Td>
      <Td>
        <Switch
          checked={menu.requiresCooking}
          disabled={disabled}
          aria-label={`${menu.name} 조리 필요 여부`}
          onCheckedChange={(requiresCooking) => onQuickUpdate(menu, { requiresCooking })}
        />
      </Td>
      <Td>
        <Switch
          checked={menu.visible}
          disabled={disabled}
          aria-label={`${menu.name} 노출 여부`}
          onCheckedChange={(visible) => onQuickUpdate(menu, { visible })}
        />
      </Td>
      <Td className="font-medium text-foreground/75">{menu.displayOrder}</Td>
      <Td>
        <RowActions menu={menu} onEdit={onEdit} onDelete={onDelete} />
      </Td>
    </tr>
  );
}

function SaleMenuCard({
  menu,
  selected,
  isUpdating,
  onToggleOne,
  onEdit,
  onDelete,
  onQuickUpdate,
}: {
  menu: SaleMenu;
  selected: boolean;
  isUpdating: boolean;
  onToggleOne: (menuId: number, checked: boolean) => void;
  onEdit: (menu: SaleMenu) => void;
  onDelete: (menu: SaleMenu) => void;
  onQuickUpdate: (menu: SaleMenu, patch: Partial<SaleMenu>) => void;
}) {
  return (
    <article className={`rounded-lg border border-border bg-background p-3 ${selected ? "bg-primary/5 ring-1 ring-primary/20" : ""}`}>
      <div className="flex gap-3">
        <div className="pt-1">
          <Checkbox
            checked={selected}
            disabled={isUpdating}
            aria-label={`${menu.name} 선택`}
            onCheckedChange={(checked) => onToggleOne(menu.id, checked)}
          />
        </div>
        <MenuImage menu={menu} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{menu.name}</p>
              <p className="mt-1 text-sm font-medium">{menu.price.toLocaleString("ko-KR")}원</p>
            </div>
            <RowActions menu={menu} onEdit={onEdit} onDelete={onDelete} />
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-foreground/70">{menu.description || "-"}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <Info label="카테고리" value={menu.category?.name ?? "-"} />
        <Info label="정렬" value={String(menu.displayOrder)} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusSelect menu={menu} disabled={isUpdating} onQuickUpdate={onQuickUpdate} />
        <OrderTypeBadges menu={menu} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <ToggleField label="조리">
          <Switch
            checked={menu.requiresCooking}
            disabled={isUpdating}
            aria-label={`${menu.name} 조리 필요 여부`}
            onCheckedChange={(requiresCooking) => onQuickUpdate(menu, { requiresCooking })}
          />
        </ToggleField>
        <ToggleField label="노출">
          <Switch
            checked={menu.visible}
            disabled={isUpdating}
            aria-label={`${menu.name} 노출 여부`}
            onCheckedChange={(visible) => onQuickUpdate(menu, { visible })}
          />
        </ToggleField>
      </div>
    </article>
  );
}

function MenuImage({ menu, size }: { menu: SaleMenu; size: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-12 w-12" : "h-16 w-16";

  return (
    <div className={`relative flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted`}>
      {menu.imageUrl ? (
        <Image src={menu.imageUrl} alt="" fill sizes={size === "sm" ? "48px" : "64px"} className="object-cover" unoptimized />
      ) : (
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
      )}
    </div>
  );
}

function StatusSelect({
  menu,
  disabled,
  onQuickUpdate,
}: {
  menu: SaleMenu;
  disabled: boolean;
  onQuickUpdate: (menu: SaleMenu, patch: Partial<SaleMenu>) => void;
}) {
  return (
    <SelectInput
      value={menu.status}
      disabled={disabled}
      onValueChange={(value) => onQuickUpdate(menu, { status: value as SaleMenuStatus })}
      options={[
        { value: "ACTIVE", label: STATUS_LABEL.ACTIVE },
        { value: "SOLD_OUT", label: STATUS_LABEL.SOLD_OUT },
        { value: "HIDDEN", label: STATUS_LABEL.HIDDEN },
      ]}
      aria-label={`${menu.name} 상태`}
      size="sm"
      className={`w-24 border-transparent text-xs font-medium ${STATUS_CLASS[menu.status]}`}
    />
  );
}

function OrderTypeBadges({ menu }: { menu: SaleMenu }) {
  return (
    <div className="flex gap-1">
      {menu.availableDineIn && <Badge>매장</Badge>}
      {menu.availableTakeout && <Badge>포장</Badge>}
      {!menu.availableDineIn && !menu.availableTakeout && <span className="text-sm text-foreground/60">-</span>}
    </div>
  );
}

function RowActions({
  menu,
  onEdit,
  onDelete,
}: {
  menu: SaleMenu;
  onEdit: (menu: SaleMenu) => void;
  onDelete: (menu: SaleMenu) => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={() => onEdit(menu)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-accent"
        aria-label={`${menu.name} 수정`}
      >
        <Edit2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(menu)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/50 text-destructive hover:bg-destructive/10"
        aria-label={`${menu.name} 삭제`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-2.5 py-2">
      <p className="text-xs font-semibold text-foreground/60">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-foreground/80">{value}</p>
    </div>
  );
}

function ToggleField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-2.5 py-2">
      <span className="text-xs font-semibold text-foreground/60">{label}</span>
      {children}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-foreground/80">{children}</span>;
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 text-left text-xs font-semibold text-foreground/60 ${className}`}>{children}</th>;
}

function Td({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={`px-4 py-3 ${className}`}>{children}</td>;
}
