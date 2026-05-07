"use client";

import { RequireRole } from "@/widgets/guards/RequireRole";
import { SaleMenuManagement } from "@/features/sale-menu-management/SaleMenuManagement";
import { BackButton } from "@/shared/ui/BackButton";

export default function SaleMenusPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
      <main className="w-full px-4 py-4">
        <header className="mb-6">
          <BackButton />
          <h1 className="text-2xl font-bold tracking-tight">판매 메뉴 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            고객 키오스크에서 주문할 메뉴명, 가격, 설명, 이미지와 판매 상태를 관리합니다.
          </p>
        </header>
        <SaleMenuManagement />
      </main>
    </RequireRole>
  );
}
