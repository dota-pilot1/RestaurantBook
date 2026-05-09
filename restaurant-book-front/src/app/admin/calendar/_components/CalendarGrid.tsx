"use client";

import { CalendarCheck2, ChevronLeft, ChevronRight } from "lucide-react";
import type { AdminCalendarEntryType } from "@/entities/admin-calendar/model/types";
import { cn } from "@/shared/lib/utils";
import type { CalendarCell } from "../_lib/calendar";
import { TYPE_META, TYPE_ORDER } from "./typeMeta";

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

type Props = {
  monthLabel: string;
  cells: CalendarCell[];
  today: string;
  selectedDate: string | null;
  countsByDate: Map<string, Set<AdminCalendarEntryType>>;
  onSelectDate: (date: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

export function CalendarGrid({
  monthLabel,
  cells,
  today,
  selectedDate,
  countsByDate,
  onSelectDate,
  onPrev,
  onNext,
  onToday,
}: Props) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck2 className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">{monthLabel}</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onPrev}
            aria-label="이전 달"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="inline-flex h-8 items-center rounded-md border border-border bg-background px-2.5 text-xs font-medium hover:bg-accent"
          >
            오늘
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="다음 달"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1">
        {WEEK_LABELS.map((label, index) => (
          <div
            key={label}
            className={cn(
              "px-2 py-1.5 text-center text-xs font-medium",
              index === 0
                ? "text-rose-500"
                : index === 6
                  ? "text-sky-500"
                  : "text-muted-foreground",
            )}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell, index) => {
          const types = countsByDate.get(cell.date);
          const dotTypes = types ? TYPE_ORDER.filter((type) => types.has(type)) : [];
          const isToday = cell.date === today;
          const isSelected = cell.date === selectedDate;
          const weekday = index % 7;

          return (
            <button
              type="button"
              key={`${cell.date}-${index}`}
              onClick={() => onSelectDate(cell.date)}
              className={cn(
                "group flex min-h-[74px] flex-col items-stretch rounded-md border p-1.5 text-left transition sm:min-h-[86px]",
                cell.inMonth ? "bg-background" : "bg-muted/50",
                isSelected
                  ? "border-primary/60 bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40 hover:bg-accent/60",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : !cell.inMonth
                      ? "text-muted-foreground/50"
                      : weekday === 0
                        ? "text-rose-500"
                        : weekday === 6
                          ? "text-sky-500"
                          : "text-foreground",
                )}
              >
                {cell.day}
              </span>
              <div className="mt-2 flex flex-wrap gap-1">
                {dotTypes.map((type) => (
                  <span
                    key={type}
                    title={TYPE_META[type].label}
                    className={cn("h-1.5 w-1.5 rounded-full", TYPE_META[type].dot)}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
