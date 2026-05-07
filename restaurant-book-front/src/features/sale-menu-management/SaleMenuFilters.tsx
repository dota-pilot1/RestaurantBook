"use client";

import type { SaleMenuFilters as Filters, SaleMenuStatus } from "@/entities/sale-menu/model/types";
import type { SaleMenuCategory } from "@/entities/sale-menu-category/model/types";
import { SelectInput } from "@/shared/ui/SelectInput";

type Props = {
  filters: Filters;
  categories: SaleMenuCategory[];
  onChange: (filters: Filters) => void;
};

export function SaleMenuFilters({ filters, categories, onChange }: Props) {
  return (
    <div className="mb-4 grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <input
        value={filters.keyword ?? ""}
        onChange={(e) => onChange({ ...filters, keyword: e.target.value || undefined })}
        placeholder="메뉴명 검색"
        className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <SelectInput
        value={filters.categoryId?.toString() ?? ""}
        onValueChange={(value) => onChange({ ...filters, categoryId: value ? Number(value) : undefined })}
        options={[
          { value: "", label: "전체 카테고리" },
          ...categories.map((category) => ({ value: category.id.toString(), label: category.name })),
        ]}
        aria-label="카테고리 필터"
      />
      <SelectInput
        value={filters.status ?? ""}
        onValueChange={(value) => onChange({ ...filters, status: (value || undefined) as SaleMenuStatus | undefined })}
        options={[
          { value: "", label: "전체 상태" },
          { value: "ACTIVE", label: "판매중" },
          { value: "SOLD_OUT", label: "품절" },
          { value: "HIDDEN", label: "숨김" },
        ]}
        aria-label="상태 필터"
      />
      <SelectInput
        value={filters.visible === undefined ? "" : String(filters.visible)}
        onValueChange={(value) => onChange({ ...filters, visible: value ? value === "true" : undefined })}
        options={[
          { value: "", label: "전체 노출" },
          { value: "true", label: "노출" },
          { value: "false", label: "미노출" },
        ]}
        aria-label="노출 필터"
      />
    </div>
  );
}
