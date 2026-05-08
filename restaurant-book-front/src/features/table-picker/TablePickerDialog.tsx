"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, MapPin, Search, X } from "lucide-react";
import { restaurantTableApi } from "@/entities/restaurant-table/api/restaurantTableApi";
import { cn } from "@/shared/lib/utils";

type Props = {
  open: boolean;
  currentTableName: string;
  onSelect: (tableName: string) => void;
  onClose: () => void;
};

export function TablePickerDialog({ open, currentTableName, onSelect, onClose }: Props) {
  const [keyword, setKeyword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ["restaurant-tables-active"],
    queryFn: restaurantTableApi.listActive,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    setKeyword("");
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return tables;
    return tables.filter((t) => t.name.toLowerCase().includes(q));
  }, [tables, keyword]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="table-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-lg border border-border bg-background shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="table-picker-title" className="text-base font-semibold">
              테이블 선택
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              사용할 테이블을 선택하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-border px-5 py-3">
          <div className="relative">
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
              className="grid gap-2"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
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
                        "group relative flex h-20 w-full flex-col items-center justify-center rounded-md border text-sm font-medium transition-colors",
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-accent",
                      )}
                    >
                      <MapPin
                        className={cn(
                          "mb-1 h-4 w-4",
                          selected ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span className="px-2 text-center leading-tight break-keep">
                        {t.name}
                      </span>
                      {selected && (
                        <span className="absolute right-1.5 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
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
          <span>
            현재 선택:{" "}
            <span className="font-medium text-foreground">
              {currentTableName || "없음"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
