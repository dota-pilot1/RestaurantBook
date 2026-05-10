"use client";

import type { SaleMenu } from "@/entities/sale-menu/model/types";
import type { SaleMenuCategory } from "@/entities/sale-menu-category/model/types";
import { cn } from "@/shared/lib/utils";

type Props = {
  categories: SaleMenuCategory[];
  menus: SaleMenu[];
  selectedCategoryId?: number;
  onSelect: (categoryId?: number) => void;
};

export function SaleMenuCategoryTabs({
  categories,
  menus,
  selectedCategoryId,
  onSelect,
}: Props) {
  const counts = new Map<number, number>();
  menus.forEach((menu) => {
    if (!menu.category) return;
    counts.set(menu.category.id, (counts.get(menu.category.id) ?? 0) + 1);
  });

  const sortedCategories = [...categories].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.id - b.id,
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CategoryTab
        active={selectedCategoryId === undefined}
        label={`전체 (${menus.length})`}
        onClick={() => onSelect(undefined)}
      />
      {sortedCategories.map((category) => (
        <CategoryTab
          key={category.id}
          active={selectedCategoryId === category.id}
          label={`${category.name} (${counts.get(category.id) ?? 0})`}
          onClick={() => onSelect(category.id)}
        />
      ))}
    </div>
  );
}

function CategoryTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-md border px-3 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}
