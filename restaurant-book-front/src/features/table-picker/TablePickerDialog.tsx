"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, MapPin, Search, Settings, X } from "lucide-react";
import { restaurantTableApi } from "@/entities/restaurant-table/api/restaurantTableApi";
import { cn } from "@/shared/lib/utils";
import { TableManagementDialog } from "@/features/table-management/TableManagementDialog";

type Props = {
  open: boolean;
  currentTableName: string;
  canManageTables?: boolean;
  onSelect: (tableName: string) => void;
  onClose: () => void;
};

export function TablePickerDialog({
  open,
  currentTableName,
  canManageTables = false,
  onSelect,
  onClose,
}: Props) {
  const [keyword, setKeyword] = useState("");
  const [mounted, setMounted] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ["restaurant-tables-active"],
    queryFn: restaurantTableApi.listActive,
    enabled: open,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setKeyword("");
    setManagementOpen(false);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (managementOpen) {
        setManagementOpen(false);
      } else {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [managementOpen, open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return tables;
    return tables.filter((t) => t.name.toLowerCase().includes(q));
  }, [tables, keyword]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="table-picker-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(720px,calc(100vh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id="table-picker-title" className="text-base font-semibold">
              테이블 선택
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              사용할 테이블을 선택하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 border-b border-border px-5 py-4">
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="테이블 이름 검색"
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
              />
            </div>
            {canManageTables && (
              <button
                type="button"
                onClick={() => setManagementOpen(true)}
                aria-label="테이블 관리"
                title="테이블 관리"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">현재 선택</span>
            <span className="font-semibold text-foreground">
              {currentTableName || "없음"}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              테이블 목록을 불러오는 중...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {keyword.trim()
                ? "검색 결과가 없습니다."
                : "등록된 테이블이 없습니다."}
            </div>
          ) : (
            <ul
              className="grid gap-3"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              }}
            >
              {filtered.map((t) => {
                const selected = t.name === currentTableName;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(t.name);
                        onClose();
                      }}
                      className={cn(
                        "group relative flex h-24 w-full flex-col items-center justify-center rounded-md border text-sm font-semibold transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-accent",
                      )}
                    >
                      <MapPin
                        className={cn(
                          "mb-2 h-5 w-5",
                          selected ? "text-primary-foreground" : "text-muted-foreground",
                        )}
                      />
                      <span className="px-2 text-center leading-tight break-keep">
                        {t.name}
                      </span>
                      {selected && (
                        <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-primary">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
          <span>총 {tables.length}개</span>
          <span>Esc로 닫기</span>
        </div>

        {canManageTables && (
          <TableManagementDialog
            open={managementOpen}
            onClose={() => setManagementOpen(false)}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
