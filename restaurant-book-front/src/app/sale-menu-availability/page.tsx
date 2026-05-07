"use client";

import { RequireRole } from "@/widgets/guards/RequireRole";
import { SaleMenuAvailabilityBoard } from "@/features/sale-menu-availability/SaleMenuAvailabilityBoard";

export default function SaleMenuAvailabilityPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
      <main className="w-full px-4 py-4">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">품절/노출 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            운영 중 판매 메뉴의 품절, 숨김, 매장/포장 판매 여부를 빠르게 조정합니다.
          </p>
        </header>
        <SaleMenuAvailabilityBoard />
      </main>
    </RequireRole>
  );
}
