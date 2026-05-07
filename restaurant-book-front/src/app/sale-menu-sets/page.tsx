"use client";

import { SaleMenuSetManagement } from "@/features/sale-menu-set-management/SaleMenuSetManagement";
import { BackButton } from "@/shared/ui/BackButton";
import { RequireRole } from "@/widgets/guards/RequireRole";

export default function SaleMenuSetsPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
      <main className="w-full px-4 py-4">
        <header className="mb-6">
          <BackButton />
          <h1 className="text-2xl font-bold tracking-tight">세트 메뉴 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            고객이 세트 단위로 주문할 상품과 단품 구성 품목을 관리합니다.
          </p>
        </header>
        <SaleMenuSetManagement />
      </main>
    </RequireRole>
  );
}
