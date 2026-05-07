"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { roleApi } from "@/entities/user/api/roleApi";
import { userApi } from "@/entities/user/api/userApi";
import type { UserListItem } from "@/entities/user/model/types";
import { SelectInput } from "@/shared/ui/SelectInput";

type Props = {
  user: UserListItem | null;
  onClose: () => void;
};

export function RoleChangeDialog({ user, onClose }: Props) {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: roleApi.list,
    enabled: !!user,
  });

  useEffect(() => {
    if (user) setSelectedRoleId(user.role.id);
  }, [user]);

  const mutation = useMutation({
    mutationFn: (roleId: number) => userApi.changeRole(user!.id, roleId),
    onSuccess: () => {
      toast.success("롤이 변경되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: () => toast.error("롤 변경에 실패했습니다."),
  });

  if (!user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-background p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-1">롤 변경</h2>
        <p className="text-sm text-muted-foreground mb-4">
          <span className="font-medium text-foreground">{user.username}</span> ({user.email})
        </p>

        <label className="block space-y-1 mb-4">
          <span className="text-sm font-medium">새 역할</span>
          <SelectInput
            value={selectedRoleId?.toString() ?? ""}
            disabled={rolesLoading || !roles}
            onValueChange={(value) => setSelectedRoleId(value ? Number(value) : null)}
            options={
              rolesLoading
                ? [{ value: "", label: "로딩 중...", disabled: true }]
                : roles?.map((r) => ({ value: r.id.toString(), label: `${r.name} (${r.code})` })) ?? []
            }
            aria-label="새 역할"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
          >
            취소
          </button>
          <button
            type="button"
            disabled={
              mutation.isPending ||
              selectedRoleId === null ||
              selectedRoleId === user.role.id
            }
            onClick={() => selectedRoleId !== null && mutation.mutate(selectedRoleId)}
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium disabled:opacity-60 hover:opacity-90"
          >
            {mutation.isPending ? "변경 중..." : "변경"}
          </button>
        </div>
      </div>
    </div>
  );
}
