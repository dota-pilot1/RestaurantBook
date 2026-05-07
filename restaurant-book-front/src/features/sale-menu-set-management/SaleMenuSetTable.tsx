"use client";

import Image from "next/image";
import { Edit2, ImageIcon, Trash2 } from "lucide-react";
import type { SaleMenuStatus } from "@/entities/sale-menu/model/types";
import type { SaleMenuSet } from "@/entities/sale-menu-set/model/types";
import { SelectInput } from "@/shared/ui/SelectInput";
import { Switch } from "@/shared/ui/Switch";

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

export function SaleMenuSetTable({ sets, isUpdating, onEdit, onDelete, onQuickUpdate }: Props) {
  return (
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
                <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                  {set.imageUrl ? (
                    <Image src={set.imageUrl} alt="" fill sizes="48px" className="object-cover" unoptimized />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </Td>
              <Td>
                <div className="max-w-[260px]">
                  <p className="font-medium">{set.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{set.description || "-"}</p>
                </div>
              </Td>
              <Td>
                <p className="max-w-[280px] truncate text-xs text-muted-foreground">
                  {set.items.map((item) => `${item.saleMenu.name} x${item.quantity}`).join(", ") || "-"}
                </p>
              </Td>
              <Td className="font-medium">{set.price.toLocaleString("ko-KR")}원</Td>
              <Td>
                <SelectInput
                  value={set.status}
                  disabled={isUpdating}
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
              </Td>
              <Td>
                <div className="flex gap-1">
                  {set.availableDineIn && <Badge>매장</Badge>}
                  {set.availableTakeout && <Badge>포장</Badge>}
                  {!set.availableDineIn && !set.availableTakeout && <span className="text-xs text-muted-foreground">-</span>}
                </div>
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
