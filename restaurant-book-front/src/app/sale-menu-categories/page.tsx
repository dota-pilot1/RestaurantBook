"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { SaleMenuCategoryManagement } from "@/features/sale-menu-category-management/SaleMenuCategoryManagement";

export default function SaleMenuCategoriesPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
      <main className="w-full px-4 py-4">
        <header className="mb-6">
          <Link
            href="/sale-menus"
            className="mb-3 inline-flex h-8 items-center gap-1.5 rounded-md border border-input px-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            판매 메뉴로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">판매 메뉴 카테고리 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            키오스크 판매 메뉴 카테고리와 노출 순서를 관리합니다.
          </p>
        </header>
        <SaleMenuCategoryManagement />
      </main>
    </RequireRole>
  );
}
