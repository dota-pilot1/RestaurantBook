"use client";

import { RequireRole } from "@/widgets/guards/RequireRole";
import { TableManagement } from "@/features/table-management/TableManagement";

export default function TablesPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
      <main className="min-h-[calc(100vh-3.5rem)] flex items-start justify-center px-4 py-10 sm:py-14 bg-gradient-to-br from-muted/40 via-background to-accent/10">
        <div className="relative w-full max-w-5xl">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-2 rounded-[1.75rem] bg-gradient-to-br from-primary/10 via-transparent to-accent/10 blur-xl"
          />
          <div className="relative flex flex-col rounded-2xl border-2 border-border bg-background shadow-[0_24px_70px_-18px_rgba(0,0,0,0.25)] ring-1 ring-black/5 overflow-hidden">
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary/70 via-primary to-primary/70"
            />
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-accent/60 via-accent to-accent/60"
            />
            <div className="flex flex-1 flex-col p-6 sm:p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">테이블 관리</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  키오스크에서 사용할 테이블을 등록하고 관리합니다.
                </p>
              </div>
              <TableManagement />
            </div>
          </div>
        </div>
      </main>
    </RequireRole>
  );
}
