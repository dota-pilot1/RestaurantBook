"use client";

import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { saleMenuApi } from "@/entities/sale-menu/api/saleMenuApi";
import type { SaleMenu, SaleMenuStatus } from "@/entities/sale-menu/model/types";
import type { SaleMenuCategory } from "@/entities/sale-menu-category/model/types";
import { toast, toastError } from "@/shared/lib/toast";
import { SelectInput } from "@/shared/ui/SelectInput";
import { Switch } from "@/shared/ui/Switch";
import { SaleMenuImageField } from "./SaleMenuImageField";

const schema = z.object({
  categoryId: z.number().nullable(),
  name: z.string().min(1, "메뉴명을 입력해주세요.").max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, "0 이상으로 입력해주세요."),
  imageUrl: z.string().nullable(),
  status: z.enum(["ACTIVE", "SOLD_OUT", "HIDDEN"]),
  visible: z.boolean(),
  availableDineIn: z.boolean(),
  availableTakeout: z.boolean(),
  displayOrder: z.number().min(0, "0 이상으로 입력해주세요."),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  menu?: SaleMenu | null;
  categories: SaleMenuCategory[];
  onClose: () => void;
};

export function SaleMenuFormDialog({ open, menu, categories, onClose }: Props) {
  const isEdit = !!menu;
  const qc = useQueryClient();
  const { register, control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(),
  });
  const imageUrl = useWatch({ control, name: "imageUrl" });
  const visible = useWatch({ control, name: "visible" });
  const availableDineIn = useWatch({ control, name: "availableDineIn" });
  const availableTakeout = useWatch({ control, name: "availableTakeout" });

  useEffect(() => {
    if (!open) return;
    reset(menu ? {
      categoryId: menu.category?.id ?? null,
      name: menu.name,
      description: menu.description ?? "",
      price: menu.price,
      imageUrl: menu.imageUrl,
      status: menu.status,
      visible: menu.visible,
      availableDineIn: menu.availableDineIn,
      availableTakeout: menu.availableTakeout,
      displayOrder: menu.displayOrder,
    } : defaultValues());
  }, [open, menu, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const body = {
        categoryId: values.categoryId,
        name: values.name,
        description: values.description?.trim() ? values.description.trim() : null,
        price: values.price,
        imageUrl: values.imageUrl,
        status: values.status as SaleMenuStatus,
        visible: values.visible,
        availableDineIn: values.availableDineIn,
        availableTakeout: values.availableTakeout,
        displayOrder: values.displayOrder,
      };
      return isEdit ? saleMenuApi.update(menu.id, body) : saleMenuApi.create(body);
    },
    onSuccess: () => {
      toast.success(isEdit ? "판매 메뉴가 수정되었습니다." : "판매 메뉴가 등록되었습니다.");
      qc.invalidateQueries({ queryKey: ["sale-menus"] });
      onClose();
    },
    onError: (e) => toastError(e, "저장에 실패했습니다."),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-base font-semibold">{isEdit ? "판매 메뉴 수정" : "판매 메뉴 추가"}</h2>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="카테고리" error={errors.categoryId?.message}>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <SelectInput
                    value={field.value?.toString() ?? ""}
                    onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                    options={[
                      { value: "", label: "카테고리 없음" },
                      ...categories.map((category) => ({ value: category.id.toString(), label: category.name })),
                    ]}
                    invalid={!!errors.categoryId}
                    aria-label="카테고리"
                  />
                )}
              />
            </Field>
            <Field label="메뉴명" error={errors.name?.message}>
              <input {...register("name")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </Field>
            <Field label="가격" error={errors.price?.message}>
              <input type="number" min={0} {...register("price", { valueAsNumber: true })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </Field>
            <Field label="상태" error={errors.status?.message}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <SelectInput
                    value={field.value}
                    onValueChange={field.onChange}
                    options={[
                      { value: "ACTIVE", label: "판매중" },
                      { value: "SOLD_OUT", label: "품절" },
                      { value: "HIDDEN", label: "숨김" },
                    ]}
                    invalid={!!errors.status}
                    aria-label="상태"
                  />
                )}
              />
            </Field>
            <Field label="정렬 순서" error={errors.displayOrder?.message}>
              <input type="number" min={0} {...register("displayOrder", { valueAsNumber: true })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </Field>
          </div>
          <Field label="설명" error={errors.description?.message}>
            <textarea {...register("description")} rows={3} className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <Field label="대표 이미지" error={errors.imageUrl?.message}>
            <SaleMenuImageField value={imageUrl} onChange={(url) => setValue("imageUrl", url)} />
          </Field>
          <div className="grid gap-2 md:grid-cols-3">
            <Toggle label="노출" checked={visible} onChange={(v) => setValue("visible", v)} />
            <Toggle label="매장 주문 가능" checked={availableDineIn} onChange={(v) => setValue("availableDineIn", v)} />
            <Toggle label="포장 주문 가능" checked={availableTakeout} onChange={(v) => setValue("availableTakeout", v)} />
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

function defaultValues(): FormValues {
  return {
    categoryId: null,
    name: "",
    description: "",
    price: 0,
    imageUrl: null,
    status: "ACTIVE",
    visible: true,
    availableDineIn: true,
    availableTakeout: true,
    displayOrder: 0,
  };
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
