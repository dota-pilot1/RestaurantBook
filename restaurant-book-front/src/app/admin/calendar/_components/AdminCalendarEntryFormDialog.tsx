"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { AdminCalendarEntry } from "@/entities/admin-calendar/model/types";
import {
  useCreateAdminCalendarEntry,
  useDeleteAdminCalendarEntry,
  useUpdateAdminCalendarEntry,
} from "@/entities/admin-calendar/model/useAdminCalendar";
import { toast, toastError } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { todayKST, weekdayKo } from "../_lib/calendar";
import { TYPE_META, TYPE_ORDER } from "./typeMeta";

const schema = z.object({
  scheduleDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다."),
  type: z.enum(["NOTICE", "HOLIDAY", "EVENT", "MEMO"] as const),
  title: z.string().min(1, "제목을 입력해주세요.").max(120, "제목은 120자 이내여야 합니다."),
  timeText: z.string().max(40, "시간은 40자 이내여야 합니다.").optional(),
  content: z.string().max(4000).optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  mode: "create" | "edit";
  entry?: AdminCalendarEntry | null;
  defaultDate?: string;
  onClose: () => void;
};

export function AdminCalendarEntryFormDialog({
  open,
  mode,
  entry,
  defaultDate,
  onClose,
}: Props) {
  const isEdit = mode === "edit";
  const [confirmOpen, setConfirmOpen] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(defaultDate),
  });

  useEffect(() => {
    if (!open) return;
    reset(
      isEdit && entry
        ? {
            scheduleDate: entry.scheduleDate,
            type: entry.type,
            title: entry.title,
            timeText: entry.timeText ?? "",
            content: entry.content ?? "",
          }
        : defaultValues(defaultDate),
    );
  }, [open, isEdit, entry, defaultDate, reset]);

  const createMutation = useCreateAdminCalendarEntry();
  const updateMutation = useUpdateAdminCalendarEntry();
  const deleteMutation = useDeleteAdminCalendarEntry();

  const onSubmit = (values: FormValues) => {
    const body = {
      scheduleDate: values.scheduleDate,
      type: values.type,
      title: values.title.trim(),
      timeText: values.timeText?.trim() ? values.timeText.trim() : null,
      content: values.content?.trim() ? values.content.trim() : null,
    };

    if (isEdit && entry) {
      updateMutation.mutate(
        { id: entry.id, body },
        {
          onSuccess: () => {
            toast.success("일정이 수정되었습니다.");
            onClose();
          },
          onError: (error) => toastError(error, "수정에 실패했습니다."),
        },
      );
      return;
    }

    createMutation.mutate(body, {
      onSuccess: () => {
        toast.success("일정이 등록되었습니다.");
        onClose();
      },
      onError: (error) => toastError(error, "등록에 실패했습니다."),
    });
  };

  const handleDelete = () => {
    if (!entry) return;
    deleteMutation.mutate(entry.id, {
      onSuccess: () => {
        toast.success("일정이 삭제되었습니다.");
        setConfirmOpen(false);
        onClose();
      },
      onError: (error) => toastError(error, "삭제에 실패했습니다."),
    });
  };

  const currentType = useWatch({ control, name: "type" });
  const currentDate = useWatch({ control, name: "scheduleDate" });
  const dateWeekday =
    currentDate && /^\d{4}-\d{2}-\d{2}$/.test(currentDate) ? weekdayKo(currentDate) : null;
  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting;

  if (!open) return null;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-calendar-dialog-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <div
          className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-lg"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4">
            <h2 id="admin-calendar-dialog-title" className="text-base font-semibold">
              {isEdit ? "일정 수정" : "새 일정"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEdit ? "일정 정보를 수정합니다." : "매장 운영 일정을 등록합니다."}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field
              label="날짜"
              error={errors.scheduleDate?.message}
              labelExtra={
                dateWeekday && (
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      dateWeekday.index === 0
                        ? "text-rose-500"
                        : dateWeekday.index === 6
                          ? "text-sky-500"
                          : "text-muted-foreground",
                    )}
                  >
                    {dateWeekday.label}요일
                  </span>
                )
              }
            >
              <input
                type="date"
                {...register("scheduleDate")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>

            <Field label="타입">
              <div className="flex flex-wrap gap-2">
                {TYPE_ORDER.map((type) => {
                  const meta = TYPE_META[type];
                  const Icon = meta.icon;
                  const checked = currentType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setValue("type", type, { shouldValidate: true })}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ring-1 transition",
                        checked
                          ? meta.chip
                          : "bg-background text-muted-foreground ring-border hover:bg-accent",
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="제목" error={errors.title?.message}>
              <input
                {...register("title")}
                maxLength={120}
                placeholder="예) 주말 단체예약 / 신메뉴 프로모션 / 임시 휴무"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>

            <Field
              label="시간 (선택)"
              hint="10:00, 14:00~16:00, 점심 이후처럼 자유롭게 입력합니다."
              error={errors.timeText?.message}
            >
              <input
                {...register("timeText")}
                maxLength={40}
                placeholder="예) 10:00, 14:00~16:00, 점심 이후"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>

            <Field label="내용 (선택)" error={errors.content?.message}>
              <textarea
                {...register("content")}
                rows={4}
                maxLength={4000}
                placeholder="공유할 운영 메모를 입력합니다."
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>

            <div className="flex items-center justify-between gap-2 pt-2">
              <div>
                {isEdit && (
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(true)}
                    className="text-sm text-destructive hover:underline"
                  >
                    삭제
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {isPending ? "저장 중..." : isEdit ? "저장" : "등록"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {isEdit && entry && (
        <ConfirmDialog
          open={confirmOpen}
          variant="destructive"
          title="이 일정을 삭제할까요?"
          description={`'${entry.title}' 일정을 영구 삭제합니다. 되돌릴 수 없습니다.`}
          confirmText="삭제"
          loading={deleteMutation.isPending}
          onConfirm={handleDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}

function defaultValues(defaultDate?: string): FormValues {
  return {
    scheduleDate: defaultDate ?? todayKST(),
    type: "NOTICE",
    title: "",
    timeText: "",
    content: "",
  };
}

function Field({
  label,
  hint,
  error,
  labelExtra,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  labelExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {labelExtra}
      </span>
      {children}
      {hint && !error && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
      {error && <span className="block text-[11px] text-destructive">{error}</span>}
    </label>
  );
}
