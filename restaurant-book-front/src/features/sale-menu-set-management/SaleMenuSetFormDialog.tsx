"use client";

import { useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { saleMenuApi } from "@/entities/sale-menu/api/saleMenuApi";
import type { SaleMenuStatus } from "@/entities/sale-menu/model/types";
import { saleMenuSetApi } from "@/entities/sale-menu-set/api/saleMenuSetApi";
import type { SaleMenuSet } from "@/entities/sale-menu-set/model/types";
import { toast, toastError } from "@/shared/lib/toast";
import { SelectInput } from "@/shared/ui/SelectInput";
import { Switch } from "@/shared/ui/Switch";
import { SaleMenuImageField } from "@/features/sale-menu-management/SaleMenuImageField";

const itemSchema = z.object({
  saleMenuId: z.number({ message: "구성 메뉴를 선택해주세요." }).min(1, "구성 메뉴를 선택해주세요."),
  quantity: z.number().min(1, "1 이상으로 입력해주세요."),
  displayOrder: z.number().min(0, "0 이상으로 입력해주세요."),
});

const schema = z.object({
  name: z.string().min(1, "세트명을 입력해주세요.").max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, "0 이상으로 입력해주세요."),
  imageUrl: z.string().nullable(),
  status: z.enum(["ACTIVE", "SOLD_OUT", "HIDDEN"]),
  visible: z.boolean(),
  availableDineIn: z.boolean(),
  availableTakeout: z.boolean(),
  displayOrder: z.number().min(0, "0 이상으로 입력해주세요."),
  items: z.array(itemSchema).min(1, "구성 품목을 1개 이상 추가해주세요."),
}).refine(
  (values) => new Set(values.items.map((item) => item.saleMenuId)).size === values.items.length,
  { path: ["items"], message: "같은 단품 메뉴를 중복으로 구성할 수 없습니다." },
);

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  saleMenuSet?: SaleMenuSet | null;
  onClose: () => void;
};

export function SaleMenuSetFormDialog({ open, saleMenuSet, onClose }: Props) {
  const isEdit = !!saleMenuSet;
  const qc = useQueryClient();
  const { register, control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(),
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const imageUrl = useWatch({ control, name: "imageUrl" });
  const visible = useWatch({ control, name: "visible" });
  const availableDineIn = useWatch({ control, name: "availableDineIn" });
  const availableTakeout = useWatch({ control, name: "availableTakeout" });

  const { data: saleMenus = [] } = useQuery({
    queryKey: ["sale-menus", "sale-menu-set-form"],
    queryFn: () => saleMenuApi.list({ visible: true }),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    reset(saleMenuSet ? {
      name: saleMenuSet.name,
      description: saleMenuSet.description ?? "",
      price: saleMenuSet.price,
      imageUrl: saleMenuSet.imageUrl,
      status: saleMenuSet.status,
      visible: saleMenuSet.visible,
      availableDineIn: saleMenuSet.availableDineIn,
      availableTakeout: saleMenuSet.availableTakeout,
      displayOrder: saleMenuSet.displayOrder,
      items: saleMenuSet.items.map((item) => ({
        saleMenuId: item.saleMenu.id,
        quantity: item.quantity,
        displayOrder: item.displayOrder,
      })),
    } : defaultValues());
  }, [open, saleMenuSet, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const body = {
        name: values.name,
        description: values.description?.trim() ? values.description.trim() : null,
        price: values.price,
        imageUrl: values.imageUrl,
        status: values.status as SaleMenuStatus,
        visible: values.visible,
        availableDineIn: values.availableDineIn,
        availableTakeout: values.availableTakeout,
        displayOrder: values.displayOrder,
        items: values.items.map((item) => ({
          saleMenuId: item.saleMenuId,
          quantity: item.quantity,
          displayOrder: item.displayOrder,
        })),
      };
      return isEdit ? saleMenuSetApi.update(saleMenuSet.id, body) : saleMenuSetApi.create(body);
    },
    onSuccess: () => {
      toast.success(isEdit ? "세트 메뉴가 수정되었습니다." : "세트 메뉴가 등록되었습니다.");
      qc.invalidateQueries({ queryKey: ["sale-menu-sets"] });
      onClose();
    },
    onError: (e) => toastError(e, "저장에 실패했습니다."),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-base font-semibold">{isEdit ? "세트 메뉴 수정" : "세트 메뉴 추가"}</h2>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="세트명" error={errors.name?.message}>
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

          <section className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">구성 품목</h3>
                {errors.items?.message && <p className="mt-1 text-xs text-destructive">{errors.items.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => append({ saleMenuId: 0, quantity: 1, displayOrder: fields.length })}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input px-2.5 text-xs font-medium hover:bg-accent"
              >
                <Plus className="h-3.5 w-3.5" />
                품목 추가
              </button>
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="grid gap-2 rounded-md border border-border p-2 md:grid-cols-[1fr_96px_96px_36px]">
                  <Controller
                    control={control}
                    name={`items.${index}.saleMenuId`}
                    render={({ field }) => (
                      <SelectInput
                        value={field.value ? field.value.toString() : ""}
                        onValueChange={(value) => field.onChange(value ? Number(value) : 0)}
                        options={[
                          { value: "", label: "단품 메뉴 선택" },
                          ...saleMenus.map((menu) => ({
                            value: menu.id.toString(),
                            label: `${menu.name} (${menu.price.toLocaleString("ko-KR")}원)`,
                          })),
                        ]}
                        invalid={!!errors.items?.[index]?.saleMenuId}
                        aria-label="구성 단품 메뉴"
                      />
                    )}
                  />
                  <input
                    type="number"
                    min={1}
                    aria-label="수량"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="number"
                    min={0}
                    aria-label="정렬 순서"
                    {...register(`items.${index}.displayOrder`, { valueAsNumber: true })}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="inline-flex h-10 w-9 items-center justify-center rounded-md border border-destructive/50 text-destructive hover:bg-destructive/10"
                    aria-label="구성 품목 삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {(errors.items?.[index]?.saleMenuId || errors.items?.[index]?.quantity || errors.items?.[index]?.displayOrder) && (
                    <p className="text-xs text-destructive md:col-span-4">
                      {errors.items?.[index]?.saleMenuId?.message || errors.items?.[index]?.quantity?.message || errors.items?.[index]?.displayOrder?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

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
    name: "",
    description: "",
    price: 0,
    imageUrl: null,
    status: "ACTIVE",
    visible: true,
    availableDineIn: true,
    availableTakeout: true,
    displayOrder: 0,
    items: [{ saleMenuId: 0, quantity: 1, displayOrder: 0 }],
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
