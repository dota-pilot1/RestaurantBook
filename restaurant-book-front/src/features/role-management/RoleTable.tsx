"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roleApi } from "@/entities/user/api/roleApi";
import { toast, toastError } from "@/shared/lib/toast";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { RoleFormDialog } from "./RoleFormDialog";
import { RolePermissionDialog } from "./RolePermissionDialog";
import type { Role } from "@/entities/user/model/types";

export function RoleTable() {
  const qc = useQueryClient();
  const [formTarget, setFormTarget] = useState<Role | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [permTarget, setPermTarget] = useState<Role | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data: roles, isLoading, isError } = useQuery({
    queryKey: ["roles"],
    queryFn: roleApi.list,
  });

  const roleList = roles ?? [];
  const selectedCount = selectedIds.size;
  const allSelected = roleList.length > 0 && roleList.every((role) => selectedIds.has(role.id));

  const deleteMutation = useMutation({
    mutationFn: (id: number) => roleApi.delete(id),
    onSuccess: () => {
      toast.success("롤이 삭제되었습니다.");
      qc.invalidateQueries({ queryKey: ["roles"] });
      setDeleteTarget(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (deleteTarget) next.delete(deleteTarget.id);
        return next;
      });
    },
    onError: (e) => toastError(e, "삭제에 실패했습니다."),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const results = await Promise.allSettled(ids.map((id) => roleApi.delete(id)));
      return {
        successCount: results.filter((result) => result.status === "fulfilled").length,
        failCount: results.filter((result) => result.status === "rejected").length,
      };
    },
    onSuccess: ({ successCount, failCount }) => {
      if (successCount > 0 && failCount === 0) {
        toast.success(`${successCount}개 롤이 삭제되었습니다.`);
      } else if (successCount > 0) {
        toast.warning(`${successCount}개 롤이 삭제되었고 ${failCount}개는 삭제하지 못했습니다.`);
      } else {
        toast.error("선택한 롤을 삭제하지 못했습니다.");
      }
      qc.invalidateQueries({ queryKey: ["roles"] });
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
    },
    onError: (e) => toastError(e, "선택 삭제에 실패했습니다."),
  });

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(roleList.map((role) => role.id)));
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">로딩 중...</p>;
  if (isError) return <p className="text-sm text-destructive">데이터를 불러오지 못했습니다.</p>;

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>선택 {selectedCount}개</span>
          <button
            type="button"
            onClick={() => setBulkDeleteOpen(true)}
            disabled={selectedCount === 0}
            className="rounded-md border border-destructive/50 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            선택 삭제
          </button>
        </div>
        <button
          onClick={() => setFormTarget("new")}
          className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + 롤 등록
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <Th className="w-10">
                <input
                  type="checkbox"
                  aria-label="전체 롤 선택"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-input"
                />
              </Th>
              <Th>ID</Th>
              <Th>코드</Th>
              <Th>이름</Th>
              <Th>설명</Th>
              <Th>시스템</Th>
              <Th className="text-right">액션</Th>
            </tr>
          </thead>
          <tbody>
            {roleList.map((role) => (
              <tr key={role.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <Td>
                  <input
                    type="checkbox"
                    aria-label={`${role.name} 롤 선택`}
                    checked={selectedIds.has(role.id)}
                    onChange={() => toggleOne(role.id)}
                    className="h-4 w-4 rounded border-input"
                  />
                </Td>
                <Td className="text-muted-foreground">{role.id}</Td>
                <Td>
                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                    {role.code}
                  </span>
                </Td>
                <Td className="font-medium">{role.name}</Td>
                <Td className="text-muted-foreground">{role.description ?? "-"}</Td>
                <Td>
                  {role.systemRole ? (
                    <span className="text-xs text-amber-600 font-medium">시스템</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setPermTarget(role)}
                      className="rounded border border-input px-2 py-0.5 text-xs hover:bg-accent"
                    >
                      권한 설정
                    </button>
                    <button
                      onClick={() => setFormTarget(role)}
                      className="rounded border border-input px-2 py-0.5 text-xs hover:bg-accent"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => setDeleteTarget(role)}
                      className="rounded border border-destructive/50 px-2 py-0.5 text-xs text-destructive hover:bg-destructive/10"
                    >
                      삭제
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RoleFormDialog
        open={formTarget !== null}
        role={formTarget === "new" ? null : formTarget}
        onClose={() => setFormTarget(null)}
      />

      <RolePermissionDialog
        role={permTarget}
        onClose={() => setPermTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`'${deleteTarget?.name}' 롤을 삭제하시겠습니까?`}
        description="이 롤을 사용 중인 유저가 있으면 삭제할 수 없습니다."
        variant="destructive"
        confirmText="삭제"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`${selectedCount}개 롤을 삭제하시겠습니까?`}
        description={"사용 중인 롤은 삭제할 수 없습니다.\n삭제 후 서버를 재시작하면 누락된 기본 롤은 초기화 파일 기준으로 다시 생성됩니다."}
        variant="destructive"
        confirmText="선택 삭제"
        loading={bulkDeleteMutation.isPending}
        onConfirm={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 text-xs font-medium text-muted-foreground text-left ${className}`}>{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2.5 ${className}`}>{children}</td>;
}
