"use client";

import { useEffect, useState } from "react";
import type { SaleMenuSetFilters as Filters } from "@/entities/sale-menu-set/model/types";
import type { SaleMenuStatus } from "@/entities/sale-menu/model/types";
import { SelectInput } from "@/shared/ui/SelectInput";

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

export function SaleMenuSetFilters({ filters, onChange }: Props) {
  const [keyword, setKeyword] = useState(filters.keyword ?? "");

  useEffect(() => {
    setKeyword(filters.keyword ?? "");
  }, [filters.keyword]);

  const applyKeyword = () => {
    onChange({ ...filters, keyword: keyword.trim() || undefined });
  };

  return (
    <div className="mb-4 grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1.4fr_1fr_1fr]">
      <div className="relative">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              applyKeyword();
            }
          }}
          placeholder="세트명 검색"
          className="w-full rounded-md border border-input bg-background px-3 py-2 pr-14 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          Enter
        </kbd>
      </div>
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
