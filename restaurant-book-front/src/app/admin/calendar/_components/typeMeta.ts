import {
  CalendarOff,
  ClipboardList,
  Megaphone,
  PartyPopper,
  type LucideIcon,
} from "lucide-react";
import type { AdminCalendarEntryType } from "@/entities/admin-calendar/model/types";

export type TypeMeta = {
  label: string;
  icon: LucideIcon;
  chip: string;
  dot: string;
};

export const TYPE_META: Record<AdminCalendarEntryType, TypeMeta> = {
  NOTICE: {
    label: "공지",
    icon: Megaphone,
    chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    dot: "bg-amber-500",
  },
  HOLIDAY: {
    label: "휴무",
    icon: CalendarOff,
    chip: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    dot: "bg-rose-500",
  },
  EVENT: {
    label: "이벤트",
    icon: PartyPopper,
    chip: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    dot: "bg-violet-500",
  },
  MEMO: {
    label: "메모",
    icon: ClipboardList,
    chip: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    dot: "bg-sky-500",
  },
};

export const TYPE_ORDER: AdminCalendarEntryType[] = ["NOTICE", "HOLIDAY", "EVENT", "MEMO"];
