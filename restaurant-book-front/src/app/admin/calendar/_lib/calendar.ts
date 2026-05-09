export type CalendarCell = { date: string; inMonth: boolean; day: number };

export function ymd(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function todayKST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

export function buildCells(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    cells.push({ date: ymd(date), inMonth: false, day: date.getDate() });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: ymd(new Date(year, month, day)), inMonth: true, day });
  }
  while (cells.length < 42) {
    const last = new Date(cells[cells.length - 1].date);
    last.setDate(last.getDate() + 1);
    cells.push({ date: ymd(last), inMonth: false, day: last.getDate() });
  }
  return cells;
}

export function monthRange(cells: CalendarCell[]): { from: string; to: string } {
  return { from: cells[0].date, to: cells[cells.length - 1].date };
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function weekdayKo(dateStr: string): { label: string; index: number } {
  const [year, month, day] = dateStr.split("-").map(Number);
  const index = new Date(year, month - 1, day).getDay();
  return { label: WEEKDAY_KO[index], index };
}
