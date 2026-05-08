"use client";

import Image from "next/image";
import { Edit2, ImageIcon, Trash2 } from "lucide-react";
import type { SaleMenu, SaleMenuStatus } from "@/entities/sale-menu/model/types";
import { Checkbox } from "@/shared/ui/Checkbox";
import { SelectInput } from "@/shared/ui/SelectInput";
import { Switch } from "@/shared/ui/Switch";

type Props = {
  menus: SaleMenu[];
  isUpdating: boolean;
  selectedIds: Set<number>;
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: (checked: boolean) => void;
  onToggleOne: (menuId: number, checked: boolean) => void;
  onEdit: (menu: SaleMenu) => void;
  onDelete: (menu: SaleMenu) => void;
  onQuickUpdate: (menu: SaleMenu, patch: Partial<SaleMenu>) => void;
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

export function SaleMenuTable({
  menus,
  isUpdating,
  selectedIds,
  allSelected,
  someSelected,
  onToggleAll,
  onToggleOne,
  onEdit,
  onDelete,
  onQuickUpdate,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[1040px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
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
          {menus.length ? menus.map((menu) => (
            <tr
              key={menu.id}
              className={`border-b border-border last:border-0 hover:bg-muted/20 ${
                selectedIds.has(menu.id) ? "bg-primary/5" : ""
              }`}
            >
              <Td>
                <Checkbox
                  checked={selectedIds.has(menu.id)}
                  disabled={isUpdating}
                  aria-label={`${menu.name} 선택`}
                  onCheckedChange={(checked) => onToggleOne(menu.id, checked)}
                />
              </Td>
              <Td>
                <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                  {menu.imageUrl ? (
                    <Image src={menu.imageUrl} alt="" fill sizes="48px" className="object-cover" unoptimized />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </Td>
              <Td>
                <div className="max-w-[260px]">
                  <p className="font-medium">{menu.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{menu.description || "-"}</p>
                </div>
              </Td>
              <Td>{menu.category?.name ?? "-"}</Td>
              <Td className="font-medium">{menu.price.toLocaleString("ko-KR")}원</Td>
              <Td>
                <SelectInput
                  value={menu.status}
                  disabled={isUpdating}
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
              </Td>
              <Td>
                <div className="flex gap-1">
                  {menu.availableDineIn && <Badge>매장</Badge>}
                  {menu.availableTakeout && <Badge>포장</Badge>}
                  {!menu.availableDineIn && !menu.availableTakeout && <span className="text-xs text-muted-foreground">-</span>}
                </div>
              </Td>
              <Td>
                <Switch
                  checked={menu.requiresCooking}
                  disabled={isUpdating}
                  aria-label={`${menu.name} 조리 필요 여부`}
                  onCheckedChange={(requiresCooking) => onQuickUpdate(menu, { requiresCooking })}
                />
              </Td>
              <Td>
                <Switch
                  checked={menu.visible}
                  disabled={isUpdating}
                  aria-label={`${menu.name} 노출 여부`}
                  onCheckedChange={(visible) => onQuickUpdate(menu, { visible })}
                />
              </Td>
              <Td className="text-muted-foreground">{menu.displayOrder}</Td>
              <Td>
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
              </Td>
            </tr>
          )) : (
            <tr>
              <Td colSpan={11} className="py-8 text-center text-muted-foreground">
                등록된 판매 메뉴가 없습니다.
              </Td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
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
