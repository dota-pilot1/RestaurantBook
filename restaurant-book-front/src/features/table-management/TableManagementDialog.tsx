"use client";

import { X } from "lucide-react";
import { TableManagement } from "./TableManagement";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function TableManagementDialog({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="table-management-dialog-title"
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(760px,calc(100vh-2rem))] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-border bg-background shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id="table-management-dialog-title" className="text-base font-semibold">
              테이블 관리
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              키오스크에서 사용할 테이블을 등록하고 관리합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="테이블 관리 닫기"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          <TableManagement />
        </div>
      </div>
    </div>
  );
}
