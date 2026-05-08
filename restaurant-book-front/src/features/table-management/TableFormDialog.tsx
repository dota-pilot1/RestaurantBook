"use client";

import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { restaurantTableApi } from "@/entities/restaurant-table/api/restaurantTableApi";
import type { RestaurantTable } from "@/entities/restaurant-table/model/types";
import { toast, toastError } from "@/shared/lib/toast";
import { FormField } from "@/shared/ui/FormField";
import { TextInput } from "@/shared/ui/TextInput";
import { Switch } from "@/shared/ui/Switch";

const schema = z.object({
  name: z.string().min(1, "이름을 입력해주세요.").max(100, "100자 이하로 입력해주세요."),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  table?: RestaurantTable | null;
  onClose: () => void;
};

export function TableFormDialog({ open, table, onClose }: Props) {
  const isEdit = !!table;
  const qc = useQueryClient();

  const { register, control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", active: true },
  });

  const active = useWatch({ control, name: "active" });

  useEffect(() => {
    if (!open) return;
    reset(table
      ? { name: table.name, active: table.active }
      : { name: "", active: true }
    );
  }, [open, table, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const tables = qc.getQueryData<RestaurantTable[]>(["restaurant-tables"]) ?? [];
      const nextDisplayOrder =
        tables.reduce((max, t) => Math.max(max, t.displayOrder), 0) + 1;

      return isEdit
        ? restaurantTableApi.update(table.id, { ...values, displayOrder: table.displayOrder })
        : restaurantTableApi.create({ ...values, displayOrder: nextDisplayOrder });
    },
    onSuccess: () => {
      toast.success(isEdit ? "테이블이 수정되었습니다." : "테이블이 추가되었습니다.");
      qc.invalidateQueries({ queryKey: ["restaurant-tables"] });
      qc.invalidateQueries({ queryKey: ["restaurant-tables-active"] });
      onClose();
    },
    onError: (e) => toastError(e, isEdit ? "테이블 수정에 실패했습니다." : "테이블 추가에 실패했습니다."),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">{isEdit ? "테이블 수정" : "테이블 추가"}</h2>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <FormField label="테이블 이름" htmlFor="table-name" error={errors.name?.message}>
            <TextInput
              id="table-name"
              placeholder="예: 1번 테이블"
              invalid={!!errors.name}
              {...register("name")}
            />
          </FormField>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <span className="text-sm font-medium">사용 중</span>
            <Switch
              checked={active}
              onCheckedChange={(v) => setValue("active", v)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {mutation.isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
