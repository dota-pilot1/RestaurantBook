"use client";

import { useMemo, useState } from "react";
import { CalendarCheck2 } from "lucide-react";
import type {
  AdminCalendarEntry,
  AdminCalendarEntryType,
} from "@/entities/admin-calendar/model/types";
import { useAdminCalendarEntries } from "@/entities/admin-calendar/model/useAdminCalendar";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { AdminCalendarEntryFormDialog } from "./_components/AdminCalendarEntryFormDialog";
import { CalendarGrid } from "./_components/CalendarGrid";
import { EntryTable } from "./_components/EntryTable";
import { TYPE_META, TYPE_ORDER } from "./_components/typeMeta";
import { buildCells, monthRange, todayKST } from "./_lib/calendar";

type DialogState =
  | { mode: "create"; defaultDate: string }
  | { mode: "edit"; entry: AdminCalendarEntry }
  | null;

export default function AdminCalendarPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN"]}>
      <AdminCalendarPageInner />
    </RequireRole>
  );
}

function AdminCalendarPageInner() {
  const today = todayKST();
  const [cursor, setCursor] = useState(() => {
    const date = new Date(today);
    return { year: date.getFullYear(), month: date.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);

  const cells = useMemo(() => buildCells(cursor.year, cursor.month), [cursor]);
  const range = useMemo(() => monthRange(cells), [cells]);
  const monthLabel = `${cursor.year}년 ${cursor.month + 1}월`;

  const {
    data: entries = [],
    isError,
    isLoading,
    error,
  } = useAdminCalendarEntries(range.from, range.to);

  const countsByDate = useMemo(() => {
    const map = new Map<string, Set<AdminCalendarEntryType>>();
    for (const entry of entries) {
      if (!map.has(entry.scheduleDate)) map.set(entry.scheduleDate, new Set());
      map.get(entry.scheduleDate)?.add(entry.type);
    }
    return map;
  }, [entries]);

  const filteredEntries = useMemo(
    () => (selectedDate ? entries.filter((entry) => entry.scheduleDate === selectedDate) : entries),
    [entries, selectedDate],
  );

  const moveMonth = (delta: number) => {
    setCursor((current) => {
      const nextMonth = current.month + delta;
      return {
        year: current.year + Math.floor(nextMonth / 12),
        month: ((nextMonth % 12) + 12) % 12,
      };
    });
    setSelectedDate(null);
  };

  const goToday = () => {
    const date = new Date(today);
    setCursor({ year: date.getFullYear(), month: date.getMonth() });
    setSelectedDate(today);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date));
  };

  const handleClickAddNew = () => {
    setDialog({ mode: "create", defaultDate: selectedDate ?? today });
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-slate-100/75 px-4 py-5 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">
            OPERATIONS CALENDAR
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight">
            <CalendarCheck2 className="h-6 w-6 text-primary" />
            운영 일정 관리
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            휴무, 프로모션, 단체예약, 발주/점검 메모 등 매장 운영 일정을 관리합니다.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm dark:border-border dark:bg-card">
            <CalendarGrid
              monthLabel={monthLabel}
              cells={cells}
              today={today}
              selectedDate={selectedDate}
              countsByDate={countsByDate}
              onSelectDate={handleSelectDate}
              onPrev={() => moveMonth(-1)}
              onNext={() => moveMonth(1)}
              onToday={goToday}
            />
            <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3">
              {TYPE_ORDER.map((type) => {
                const meta = TYPE_META[type];
                return (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm dark:border-border dark:bg-card">
            <EntryTable
              entries={filteredEntries}
              totalCount={entries.length}
              selectedDate={selectedDate}
              onClearFilter={() => setSelectedDate(null)}
              onClickRow={(entry) => setDialog({ mode: "edit", entry })}
              onClickAddNew={handleClickAddNew}
            />
            {isLoading && <p className="mt-3 text-xs text-muted-foreground">불러오는 중...</p>}
            {isError && (
              <p className="mt-3 text-xs text-destructive">
                {(error as Error)?.message ?? "데이터를 불러오지 못했습니다."}
              </p>
            )}
          </section>
        </div>
      </div>

      {dialog && (
        <AdminCalendarEntryFormDialog
          open
          mode={dialog.mode}
          entry={dialog.mode === "edit" ? dialog.entry : null}
          defaultDate={dialog.mode === "create" ? dialog.defaultDate : undefined}
          onClose={() => setDialog(null)}
        />
      )}
    </main>
  );
}
