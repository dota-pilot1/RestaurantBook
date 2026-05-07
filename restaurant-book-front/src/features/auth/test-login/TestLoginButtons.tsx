"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { authActions } from "@/entities/user/model/authStore";
import { getApiError } from "@/shared/api/errors";
import { getPostLoginPath } from "@/entities/user/lib/roleRoutes";
import { TEST_ACCOUNTS, TEST_LOGIN_ENABLED, type TestAccount } from "./testAccounts";

type Props = {
  nextPath?: string;
  onError?: (message: string) => void;
};

const ROLE_BUTTON_STYLES: Record<string, string> = {
  ROLE_ADMIN: "border-red-500/30 bg-red-500/10 text-red-600 hover:bg-red-500/15",
  ROLE_MANAGER: "border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15",
  ROLE_KITCHEN: "border-blue-500/30 bg-blue-500/10 text-blue-600 hover:bg-blue-500/15",
  ROLE_STAFF: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15",
  ROLE_CUSTOMER: "border-slate-500/30 bg-slate-500/10 text-slate-600 hover:bg-slate-500/15",
};

export function TestLoginButtons({ nextPath, onError }: Props) {
  const router = useRouter();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  if (!TEST_LOGIN_ENABLED) return null;

  const handleLogin = async (account: TestAccount) => {
    setPendingEmail(account.email);
    onError?.("");
    try {
      const user = await authActions.login(account.email, account.password);
      toast.success(`${account.label} 계정으로 로그인되었습니다.`);
      router.replace(getPostLoginPath(user, nextPath));
    } catch (e) {
      const apiError = getApiError(e);
      onError?.(apiError?.message ?? "테스트 로그인에 실패했습니다.");
    } finally {
      setPendingEmail(null);
    }
  };

  return (
    <section className="rounded-md border border-dashed border-border bg-muted/30 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <LogIn className="h-3.5 w-3.5" />
        테스트 계정
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
        {TEST_ACCOUNTS.map((account) => (
          <button
            key={account.email}
            type="button"
            disabled={!!pendingEmail}
            onClick={() => handleLogin(account)}
            className={`h-8 rounded-md border px-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
              ROLE_BUTTON_STYLES[account.roleCode] ?? "border-border bg-background text-foreground"
            }`}
            title={account.email}
          >
            {pendingEmail === account.email ? "로그인..." : account.label}
          </button>
        ))}
      </div>
    </section>
  );
}
