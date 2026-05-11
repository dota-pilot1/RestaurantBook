"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { authActions } from "@/entities/user/model/authStore";
import { getApiError } from "@/shared/api/errors";
import { getPostLoginPath } from "@/entities/user/lib/roleRoutes";
import { tableSessionStorage } from "@/shared/lib/tableSessionStorage";
import { TEST_ACCOUNTS, TEST_LOGIN_ENABLED, type TestAccount } from "./testAccounts";

type Props = {
  nextPath?: string;
  onError?: (message: string) => void;
  onAccountSelected?: (account: TestAccount) => void;
  onTableRequired?: () => void;
  tableName?: string;
};

const ROLE_BUTTON_STYLES: Record<string, string> = {
  ROLE_ADMIN: "border-red-500/30 bg-red-500/10 text-red-600 hover:bg-red-500/15",
  ROLE_MANAGER: "border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15",
  ROLE_KITCHEN: "border-blue-500/30 bg-blue-500/10 text-blue-600 hover:bg-blue-500/15",
  ROLE_STAFF: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15",
  ROLE_CUSTOMER: "border-slate-500/30 bg-slate-500/10 text-slate-600 hover:bg-slate-500/15",
};

export function TestLoginButtons({
  nextPath,
  onError,
  onAccountSelected,
  onTableRequired,
  tableName = "",
}: Props) {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  if (!TEST_LOGIN_ENABLED) return null;

  const handleLogin = async (account: TestAccount) => {
    const roleLabel = t(`roles.${account.roleCode}`, {
      ns: "nav",
      defaultValue: account.label,
    });
    onAccountSelected?.(account);
    if (account.roleCode === "ROLE_CUSTOMER" && !tableName.trim()) {
      onTableRequired?.();
      return;
    }
    setPendingEmail(account.email);
    onError?.("");
    try {
      const user = await authActions.login(account.email, account.password);
      // 고객은 사용자가 입력한 테이블명, 그 외 role은 역할 라벨로 자동 설정
      const effectiveTableName =
        account.roleCode === "ROLE_CUSTOMER" ? tableName : roleLabel;
      tableSessionStorage.setTableName(effectiveTableName);
      toast.success(t("testLoginSuccess", { role: roleLabel }), { duration: 2000 });
      router.replace(getPostLoginPath(user, nextPath));
    } catch (e) {
      const apiError = getApiError(e);
      onError?.(apiError?.message ?? t("testLoginFailed"));
    } finally {
      setPendingEmail(null);
    }
  };

  return (
    <section className="rounded-md border border-dashed border-border bg-muted/30 p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <LogIn className="h-3.5 w-3.5" />
        {t("testAccounts")}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {TEST_ACCOUNTS.map((account) => {
          const roleLabel = t(`roles.${account.roleCode}`, {
            ns: "nav",
            defaultValue: account.label,
          });
          return (
            <button
              key={account.email}
              type="button"
              disabled={!!pendingEmail}
              onClick={() => handleLogin(account)}
              className={`h-11 min-w-0 rounded-md border px-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
                ROLE_BUTTON_STYLES[account.roleCode] ?? "border-border bg-background text-foreground"
              }`}
              title={account.email}
            >
              <span className="block truncate">
                {pendingEmail === account.email ? t("testLoginPending") : roleLabel}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
