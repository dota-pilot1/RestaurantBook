"use client";

import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { saleMenuCategoryApi } from "@/entities/sale-menu-category/api/saleMenuCategoryApi";
import type { SaleMenuCategory } from "@/entities/sale-menu-category/model/types";
import { toast, toastError } from "@/shared/lib/toast";
import { Switch } from "@/shared/ui/Switch";

const schema = z.object({
  name: z.string().min(1, "이름을 입력해주세요.").max(100, "100자 이하로 입력해주세요."),
  description: z.string().max(255, "255자 이하로 입력해주세요.").optional(),
  visible: z.boolean(),
  displayOrder: z.number().min(0, "0 이상으로 입력해주세요."),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  category?: SaleMenuCategory | null;
  onClose: () => void;
};

export function SaleMenuCategoryFormDialog({ open, category, onClose }: Props) {
  const isEdit = !!category;
  const qc = useQueryClient();
  const { register, control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", visible: true, displayOrder: 0 },
  });
  const visible = useWatch({ control, name: "visible" });

  useEffect(() => {
    if (!open) return;
    reset(category
      ? {
          name: category.name,
          description: category.description ?? "",
          visible: category.visible,
          displayOrder: category.displayOrder,
        }
      : { name: "", description: "", visible: true, displayOrder: 0 }
    );
  }, [open, category, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const body = {
        name: values.name,
        description: values.description?.trim() ? values.description.trim() : null,
        visible: values.visible,
        displayOrder: values.displayOrder,
      };
      return isEdit
        ? saleMenuCategoryApi.update(category.id, body)
        : saleMenuCategoryApi.create(body);
    },
    onSuccess: () => {
      toast.success(isEdit ? "카테고리가 수정되었습니다." : "카테고리가 등록되었습니다.");
      qc.invalidateQueries({ queryKey: ["sale-menu-categories"] });
      onClose();
    },
    onError: (e) => toastError(e, "저장에 실패했습니다."),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-base font-semibold">{isEdit ? "카테고리 수정" : "카테고리 추가"}</h2>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <Field label="이름" error={errors.name?.message}>
            <input {...register("name")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <Field label="설명" error={errors.description?.message}>
            <input {...register("description")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <Field label="정렬 순서" error={errors.displayOrder?.message}>
            <input type="number" min={0} {...register("displayOrder", { valueAsNumber: true })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <span className="text-sm font-medium">노출 여부</span>
            <Switch checked={visible} onCheckedChange={(checked) => setValue("visible", checked)} aria-label="카테고리 노출 여부" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent">취소</button>
            <button type="submit" disabled={isSubmitting || mutation.isPending} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {mutation.isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}
