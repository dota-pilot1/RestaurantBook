"use client";

import { Plus, X } from "lucide-react";
import type { AdminCalendarEntry } from "@/entities/admin-calendar/model/types";
import { cn } from "@/shared/lib/utils";
import { weekdayKo } from "../_lib/calendar";
import { TYPE_META } from "./typeMeta";

type Props = {
  entries: AdminCalendarEntry[];
  totalCount: number;
  selectedDate: string | null;
  onClearFilter: () => void;
  onClickRow: (entry: AdminCalendarEntry) => void;
  onClickAddNew: () => void;
};

function formatShortDate(iso: string) {
  return iso.slice(5).replace("-", "/");
}

export function EntryTable({
  entries,
  totalCount,
  selectedDate,
  onClearFilter,
  onClickRow,
  onClickAddNew,
}: Props) {
  return (
    <div>
      <header className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {selectedDate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {selectedDate} ({weekdayKo(selectedDate).label})
              <button
                type="button"
                onClick={onClearFilter}
                aria-label="필터 해제"
                className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/15"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <h3 className="text-sm font-semibold">
            {selectedDate ? `${entries.length}건` : `이 달 일정 (${totalCount}건)`}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClickAddNew}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-3 w-3" />
          새 일정
        </button>
      </header>

      {entries.length === 0 ? (
        <div className="mt-3 rounded-md border border-dashed border-border bg-muted/30 px-3 py-10 text-center text-sm text-muted-foreground">
          {selectedDate ? "이 날짜에 등록된 일정이 없습니다." : "이 달에 등록된 일정이 없습니다."}
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr>
                <th className="w-[92px] px-3 py-2 text-left font-medium">날짜</th>
                <th className="w-[80px] px-3 py-2 text-left font-medium">타입</th>
                <th className="w-[110px] px-3 py-2 text-left font-medium">시간</th>
                <th className="px-3 py-2 text-left font-medium">제목</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const meta = TYPE_META[entry.type];
                const weekday = weekdayKo(entry.scheduleDate);
                return (
                  <tr
                    key={entry.id}
                    onClick={() => onClickRow(entry)}
                    className="cursor-pointer border-t border-border hover:bg-accent/60"
                  >
                    <td className="px-3 py-2 text-xs">
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono text-muted-foreground">
                          {formatShortDate(entry.scheduleDate)}
                        </span>
                        <span
                          className={cn(
                            "text-[10px]",
                            weekday.index === 0
                              ? "text-rose-500"
                              : weekday.index === 6
                                ? "text-sky-500"
                                : "text-muted-foreground/70",
                          )}
                        >
                          ({weekday.label})
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                          meta.chip,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {entry.timeText ?? "-"}
                    </td>
                    <td className="px-3 py-2 font-medium text-foreground">{entry.title}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
