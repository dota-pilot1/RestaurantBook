"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { loginSchema, type LoginFormValues } from "@/shared/lib/validation/auth.schema";
import { authActions } from "@/entities/user/model/authStore";
import { getApiError } from "@/shared/api/errors";
import { FormField } from "@/shared/ui/FormField";
import { TextInput } from "@/shared/ui/TextInput";
import { PasswordInput } from "@/shared/ui/PasswordInput";
import { getPostLoginPath } from "@/entities/user/lib/roleRoutes";
import { TestLoginButtons } from "@/features/auth/test-login/TestLoginButtons";
import { tableSessionStorage } from "@/shared/lib/tableSessionStorage";
import { restaurantTableApi } from "@/entities/restaurant-table/api/restaurantTableApi";
import { SelectInput } from "@/shared/ui/SelectInput";

type LoginFormProps = {
  nextPath?: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const [formError, setFormError] = useState<string | null>(null);
  const [tableName, setTableName] = useState("");

  const { data: tables = [] } = useQuery({
    queryKey: ["restaurant-tables-active"],
    queryFn: restaurantTableApi.listActive,
  });

  useEffect(() => {
    setTableName(tableSessionStorage.getTableName());
  }, []);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "admin@restaurantbook.local",
      password: "password123",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await authActions.login(values.email, values.password);
      if (user.role.code === "ROLE_CUSTOMER" && !tableName.trim()) {
        setFormError("고객 로그인은 테이블을 먼저 선택해주세요.");
        return;
      }
      tableSessionStorage.setTableName(tableName);
      toast.success(t("loginSuccess"));
      router.replace(getPostLoginPath(user, nextPath));
    } catch (e) {
      const apiError = getApiError(e);
      if (apiError?.code === "AUTH_003") {
        setError("password", { type: "server", message: apiError.message });
      } else if (apiError?.code === "AUTH_004") {
        setError("email", { type: "server", message: apiError.message });
      } else {
        setFormError(apiError?.message ?? t("loginFailed"));
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormField
        label="테이블 선택"
        htmlFor="login-table-name"
        hint="이 브라우저에서 사용할 테이블을 선택합니다."
      >
        {tables.length > 0 ? (
          <SelectInput
            value={tableName}
            onValueChange={setTableName}
            placeholder="테이블을 선택하세요"
            options={tables.map((t) => ({ value: t.name, label: t.name }))}
          />
        ) : (
          <TextInput
            id="login-table-name"
            autoComplete="off"
            placeholder="예: 3번 테이블"
            value={tableName}
            onChange={(event) => setTableName(event.target.value)}
          />
        )}
      </FormField>

      <TestLoginButtons nextPath={nextPath} onError={setFormError} tableName={tableName} />

      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      <FormField label={t("email")} htmlFor="login-email" error={errors.email?.message}>
        <TextInput
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          invalid={!!errors.email}
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </FormField>

      <FormField label={t("password")} htmlFor="login-password" error={errors.password?.message}>
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          placeholder="••••••••"
          invalid={!!errors.password}
          aria-invalid={!!errors.password}
          {...register("password")}
        />
      </FormField>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-medium disabled:opacity-60 hover:opacity-90 transition-opacity"
      >
        <LogIn className="h-4 w-4" />
        {isSubmitting ? t("signingIn") : t("signInButton")}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/register" className="underline hover:text-foreground">
          {t("signUpLink")}
        </Link>
      </p>
    </form>
  );
}
