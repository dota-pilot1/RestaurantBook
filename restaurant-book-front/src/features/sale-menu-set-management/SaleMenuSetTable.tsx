"use client";

import Image from "next/image";
import { useState } from "react";
import { Edit2, ImageIcon, LayoutGrid, Table2, Trash2 } from "lucide-react";
import type { SaleMenuStatus } from "@/entities/sale-menu/model/types";
import type { SaleMenuSet } from "@/entities/sale-menu-set/model/types";
import { SelectInput } from "@/shared/ui/SelectInput";
import { Switch } from "@/shared/ui/Switch";
import { ViewToggle } from "@/shared/ui/ViewToggle";

type Props = {
  sets: SaleMenuSet[];
  isUpdating: boolean;
  onEdit: (set: SaleMenuSet) => void;
  onDelete: (set: SaleMenuSet) => void;
  onQuickUpdate: (set: SaleMenuSet, patch: Partial<SaleMenuSet>) => void;
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

export function SaleMenuSetTable({ sets, isUpdating, onEdit, onDelete, onQuickUpdate }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">총 {sets.length}개 세트</span>
        <ViewToggle<ViewMode>
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: "table", icon: Table2, label: "테이블" },
            { value: "card", icon: LayoutGrid, label: "카드" },
          ]}
        />
      </div>

      {viewMode === "card" ? (
        sets.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sets.map((set) => (
              <SaleMenuSetCard
                key={set.id}
                set={set}
                isUpdating={isUpdating}
                onEdit={onEdit}
                onDelete={onDelete}
                onQuickUpdate={onQuickUpdate}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border py-8 text-center text-sm text-muted-foreground">
            등록된 세트 메뉴가 없습니다.
          </div>
        )
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <Th>이미지</Th>
                <Th>세트명</Th>
                <Th>구성</Th>
                <Th>가격</Th>
                <Th>상태</Th>
                <Th>주문 유형</Th>
                <Th>노출</Th>
                <Th>정렬</Th>
                <Th className="text-right">관리</Th>
              </tr>
            </thead>
            <tbody>
              {sets.length ? sets.map((set) => (
                <tr key={set.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <Td>
                    <SetImage set={set} size="sm" />
                  </Td>
                  <Td>
                    <div className="max-w-[260px]">
                      <p className="font-medium">{set.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{set.description || "-"}</p>
                    </div>
                  </Td>
                  <Td>
                    <p className="max-w-[280px] truncate text-xs text-muted-foreground">
                      {formatItems(set)}
                    </p>
                  </Td>
                  <Td className="font-medium">{set.price.toLocaleString("ko-KR")}원</Td>
                  <Td>
                    <StatusSelect set={set} disabled={isUpdating} onQuickUpdate={onQuickUpdate} />
                  </Td>
                  <Td>
                    <OrderTypeBadges set={set} />
                  </Td>
                  <Td>
                    <Switch
                      checked={set.visible}
                      disabled={isUpdating}
                      aria-label={`${set.name} 노출 여부`}
                      onCheckedChange={(visible) => onQuickUpdate(set, { visible })}
                    />
                  </Td>
                  <Td className="text-muted-foreground">{set.displayOrder}</Td>
                  <Td>
                    <RowActions set={set} onEdit={onEdit} onDelete={onDelete} />
                  </Td>
                </tr>
              )) : (
                <tr>
                  <Td colSpan={9} className="py-8 text-center text-muted-foreground">
                    등록된 세트 메뉴가 없습니다.
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function SaleMenuSetCard({
  set,
  isUpdating,
  onEdit,
  onDelete,
  onQuickUpdate,
}: {
  set: SaleMenuSet;
  isUpdating: boolean;
  onEdit: (set: SaleMenuSet) => void;
  onDelete: (set: SaleMenuSet) => void;
  onQuickUpdate: (set: SaleMenuSet, patch: Partial<SaleMenuSet>) => void;
}) {
  return (
    <article className="rounded-lg border border-border bg-background p-3">
      <div className="flex gap-3">
        <SetImage set={set} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{set.name}</p>
              <p className="mt-1 text-sm font-medium">{set.price.toLocaleString("ko-KR")}원</p>
            </div>
            <RowActions set={set} onEdit={onEdit} onDelete={onDelete} />
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{set.description || "-"}</p>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-border bg-muted/20 px-2.5 py-2">
        <p className="text-[11px] font-medium text-muted-foreground">구성</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5">{formatItems(set)}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <Info label="정렬" value={String(set.displayOrder)} />
        <div className="rounded-md border border-border bg-muted/20 px-2.5 py-2">
          <p className="text-[11px] font-medium text-muted-foreground">주문 유형</p>
          <div className="mt-1">
            <OrderTypeBadges set={set} />
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusSelect set={set} disabled={isUpdating} onQuickUpdate={onQuickUpdate} />
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-2.5 py-1.5">
          <span className="text-xs font-medium text-muted-foreground">노출</span>
          <Switch
            checked={set.visible}
            disabled={isUpdating}
            aria-label={`${set.name} 노출 여부`}
            onCheckedChange={(visible) => onQuickUpdate(set, { visible })}
          />
        </div>
      </div>
    </article>
  );
}

function SetImage({ set, size }: { set: SaleMenuSet; size: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-12 w-12" : "h-16 w-16";

  return (
    <div className={`relative flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted`}>
      {set.imageUrl ? (
        <Image src={set.imageUrl} alt="" fill sizes={size === "sm" ? "48px" : "64px"} className="object-cover" unoptimized />
      ) : (
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
      )}
    </div>
  );
}

function StatusSelect({
  set,
  disabled,
  onQuickUpdate,
}: {
  set: SaleMenuSet;
  disabled: boolean;
  onQuickUpdate: (set: SaleMenuSet, patch: Partial<SaleMenuSet>) => void;
}) {
  return (
    <SelectInput
      value={set.status}
      disabled={disabled}
      onValueChange={(value) => onQuickUpdate(set, { status: value as SaleMenuStatus })}
      options={[
        { value: "ACTIVE", label: STATUS_LABEL.ACTIVE },
        { value: "SOLD_OUT", label: STATUS_LABEL.SOLD_OUT },
        { value: "HIDDEN", label: STATUS_LABEL.HIDDEN },
      ]}
      aria-label={`${set.name} 상태`}
      size="sm"
      className={`w-24 border-transparent text-xs font-medium ${STATUS_CLASS[set.status]}`}
    />
  );
}

function OrderTypeBadges({ set }: { set: SaleMenuSet }) {
  return (
    <div className="flex gap-1">
      {set.availableDineIn && <Badge>매장</Badge>}
      {set.availableTakeout && <Badge>포장</Badge>}
      {!set.availableDineIn && !set.availableTakeout && <span className="text-xs text-muted-foreground">-</span>}
    </div>
  );
}

function RowActions({
  set,
  onEdit,
  onDelete,
}: {
  set: SaleMenuSet;
  onEdit: (set: SaleMenuSet) => void;
  onDelete: (set: SaleMenuSet) => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={() => onEdit(set)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-accent"
        aria-label={`${set.name} 수정`}
      >
        <Edit2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(set)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/50 text-destructive hover:bg-destructive/10"
        aria-label={`${set.name} 삭제`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-2.5 py-2">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-medium">{value}</p>
    </div>
  );
}

function formatItems(set: SaleMenuSet) {
  return set.items.map((item) => `${item.saleMenu.name} x${item.quantity}`).join(", ") || "-";
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">{children}</span>;
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 text-left text-xs font-medium text-muted-foreground ${className}`}>{children}</th>;
}

function Td({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={`px-4 py-2.5 ${className}`}>{children}</td>;
}
