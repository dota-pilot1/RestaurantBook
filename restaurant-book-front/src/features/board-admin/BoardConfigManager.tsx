"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { boardConfigApi } from "@/entities/board/api/boardConfigApi";
import type {
  BoardConfig,
  BoardKind,
  CreateBoardConfigBody,
  UpdateBoardConfigBody,
} from "@/entities/board/model/types";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { Switch } from "@/shared/ui/Switch";

const emptyForm: CreateBoardConfigBody & { active: boolean } = {
  code: "",
  kind: "NOTICE",
  displayName: "",
  description: "",
  allowCustomerWrite: false,
  allowComment: false,
  active: true,
  sortOrder: 0,
};

const kindOptions: { value: BoardKind; label: string }[] = [
  { value: "NOTICE", label: "공지" },
  { value: "INQUIRY", label: "문의" },
  { value: "FAQ", label: "FAQ" },
  { value: "EVENT", label: "이벤트" },
];

export function BoardConfigManager() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<BoardConfig | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["admin-board-configs"],
    queryFn: boardConfigApi.list,
  });

  useEffect(() => {
    if (!selected) {
      setForm(emptyForm);
      return;
    }
    setForm({
      code: selected.code,
      kind: selected.kind,
      displayName: selected.displayName,
      description: selected.description ?? "",
      allowCustomerWrite: selected.allowCustomerWrite,
      allowComment: selected.allowComment,
      active: selected.active,
      sortOrder: selected.sortOrder,
    });
  }, [selected]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-board-configs"] });

  const saveMutation = useMutation({
    mutationFn: () => {
      if (selected) {
        const body: UpdateBoardConfigBody = {
          displayName: form.displayName,
          description: form.description,
          allowCustomerWrite: form.allowCustomerWrite,
          allowComment: form.allowComment,
          active: form.active,
          sortOrder: Number(form.sortOrder),
        };
        return boardConfigApi.update(selected.code, body);
      }
      return boardConfigApi.create({
        code: form.code,
        kind: form.kind,
        displayName: form.displayName,
        description: form.description,
        allowCustomerWrite: form.allowCustomerWrite,
        allowComment: form.allowComment,
        sortOrder: Number(form.sortOrder),
      });
    },
    onSuccess: (next) => {
      setSelected(next);
      invalidate();
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => boardConfigApi.deactivate(selected?.code as string),
    onSuccess: () => {
      setSelected(null);
      invalidate();
    },
  });

  return (
    <RequireRole roles={["ROLE_ADMIN"]}>
      <main className="w-full px-4 py-4">
        <header className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight">게시판 설정</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            게시판 노출, 작성 허용, 답변 허용 여부를 관리합니다.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">게시판</th>
                  <th className="w-24 px-3 py-2 text-left font-medium">유형</th>
                  <th className="w-28 px-3 py-2 text-left font-medium">사용자 작성</th>
                  <th className="w-20 px-3 py-2 text-left font-medium">활성</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-10 text-center text-muted-foreground">
                      게시판 설정을 불러오는 중입니다.
                    </td>
                  </tr>
                ) : (
                  configs.map((config) => (
                    <tr
                      key={config.code}
                      className={`border-t border-border ${selected?.code === config.code ? "bg-accent" : ""}`}
                    >
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => setSelected(config)}
                          className="text-left"
                        >
                          <span className="block font-medium">{config.displayName}</span>
                          <span className="block text-xs text-muted-foreground">{config.code}</span>
                        </button>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{config.kind}</td>
                      <td className="px-3 py-3">{config.allowCustomerWrite ? "허용" : "차단"}</td>
                      <td className="px-3 py-3">{config.active ? "활성" : "비활성"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <form
            className="rounded-lg border border-border p-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">{selected ? "게시판 수정" : "게시판 추가"}</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="h-8 rounded-md border border-input px-2 text-xs hover:bg-accent"
              >
                새 설정
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">코드</span>
                <input
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  disabled={!!selected}
                  required
                  pattern="^[a-z0-9_-]+$"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:bg-muted"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">이름</span>
                <input
                  value={form.displayName}
                  onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">유형</span>
                <select
                  value={form.kind}
                  onChange={(e) => setForm((prev) => ({ ...prev, kind: e.target.value as BoardKind }))}
                  disabled={!!selected}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm disabled:bg-muted"
                >
                  {kindOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">설명</span>
                <textarea
                  value={form.description ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">정렬 순서</span>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <div className="space-y-3 rounded-md border border-border p-3">
                <ToggleRow
                  label="로그인 사용자 작성"
                  checked={form.allowCustomerWrite}
                  onChange={(value) => setForm((prev) => ({ ...prev, allowCustomerWrite: value }))}
                />
                <ToggleRow
                  label="관리자 답변"
                  checked={form.allowComment}
                  onChange={(value) => setForm((prev) => ({ ...prev, allowComment: value }))}
                />
                <ToggleRow
                  label="활성"
                  checked={form.active}
                  onChange={(value) => setForm((prev) => ({ ...prev, active: value }))}
                />
              </div>
            </div>

            {saveMutation.isError && (
              <p className="mt-3 text-sm text-destructive">게시판 설정을 저장하지 못했습니다.</p>
            )}

            <div className="mt-5 flex justify-between gap-2">
              <button
                type="button"
                disabled={!selected || deactivateMutation.isPending}
                onClick={() => deactivateMutation.mutate()}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-destructive/50 px-3 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                <Settings className="h-4 w-4" />
                비활성화
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                저장
              </button>
            </div>
          </form>
        </section>
      </main>
    </RequireRole>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
