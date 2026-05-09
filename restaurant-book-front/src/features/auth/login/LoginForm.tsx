"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import * as Popover from "@radix-ui/react-popover";
import { AlertCircle, LayoutGrid, LogIn, X } from "lucide-react";
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
import { TablePickerDialog } from "@/features/table-picker/TablePickerDialog";

type LoginFormProps = {
  nextPath?: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const [formError, setFormError] = useState<string | null>(null);
  const [tableName, setTableName] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tablePopoverOpen, setTablePopoverOpen] = useState(false);

  const { data: tables = [] } = useQuery({
    queryKey: ["restaurant-tables-active"],
    queryFn: restaurantTableApi.listActive,
  });

  useEffect(() => {
    setTableName(tableSessionStorage.getTableName());
  }, []);

  useEffect(() => {
    if (!tableName || tables.length === 0) return;
    const tableExists = tables.some((table) => table.name === tableName);
    if (tableExists) return;

    setTableName("");
    tableSessionStorage.setTableName("");
  }, [tableName, tables]);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const focusTableSelect = () => {
    document
      .getElementById("login-table-select")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await authActions.login(values.email, values.password);
      if (user.role.code === "ROLE_CUSTOMER" && !tableName.trim()) {
        setTablePopoverOpen(true);
        focusTableSelect();
        return;
      }
      tableSessionStorage.setTableName(tableName);
      toast.success(t("loginSuccess"));
      router.replace(getPostLoginPath(user, nextPath));
    } catch (e) {
      const apiError = getApiError(e);
      if (apiError?.code === "AUTH_003") {
        setError("password", { type: "server", message: t("invalidCredentials") });
      } else if (apiError?.code === "AUTH_004") {
        setError("email", { type: "server", message: t("accountInactive") });
      } else {
        setFormError(apiError?.message ?? t("loginFailed"));
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormField
        label={t("tableSelect")}
        htmlFor="login-table-name"
        hint={t("tableSelectHint")}
      >
        {tables.length > 0 ? (
          <div id="login-table-select" className="flex items-center gap-2">
            <Popover.Root open={tablePopoverOpen} onOpenChange={setTablePopoverOpen}>
              <Popover.Anchor asChild>
                <div className="flex-1">
                  <SelectInput
                    value={tableName}
                    onValueChange={(v) => { setTableName(v); setTablePopoverOpen(false); }}
                    placeholder={t("tableSelectPlaceholder")}
                    options={tables.map((t) => ({ value: t.name, label: t.name }))}
                    invalid={tablePopoverOpen}
                  />
                </div>
              </Popover.Anchor>
              <Popover.Portal>
                <Popover.Content
                  side="top"
                  align="start"
                  sideOffset={6}
                  className="z-50 flex items-center gap-2 rounded-md border border-destructive/50 bg-white px-3 py-2 text-sm text-destructive shadow-lg animate-in fade-in-0 zoom-in-95"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{t("tableRequiredForCustomer")}</span>
                  <Popover.Close className="ml-1 rounded p-0.5 hover:bg-destructive/20">
                    <X className="h-3.5 w-3.5" />
                  </Popover.Close>
                  <Popover.Arrow className="fill-destructive/20" />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              aria-label={t("openTablePicker")}
              title={t("openTablePicker")}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <TextInput
            id="login-table-name"
            autoComplete="off"
            placeholder={t("tableSelectFallbackPlaceholder")}
            value={tableName}
            onChange={(event) => setTableName(event.target.value)}
          />
        )}
      </FormField>

      <TablePickerDialog
        open={pickerOpen}
        currentTableName={tableName}
        onSelect={setTableName}
        onClose={() => setPickerOpen(false)}
      />

      <TestLoginButtons
        nextPath={nextPath}
        onAccountSelected={(account) => {
          setValue("email", account.email, { shouldValidate: true, shouldDirty: true });
          setValue("password", account.password, { shouldValidate: true, shouldDirty: true });
          clearErrors(["email", "password"]);
        }}
        onError={setFormError}
        onTableRequired={() => {
          setTablePopoverOpen(true);
          focusTableSelect();
        }}
        tableName={tableName}
      />

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
