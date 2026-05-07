"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, MailCheck, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { signupSchema, type SignupFormValues } from "@/shared/lib/validation/auth.schema";
import { authApi } from "@/entities/user/api/authApi";
import { authActions } from "@/entities/user/model/authStore";
import { getApiError, getFieldErrors } from "@/shared/api/errors";
import { FormField } from "@/shared/ui/FormField";
import { TextInput } from "@/shared/ui/TextInput";
import { PasswordInput } from "@/shared/ui/PasswordInput";

const EMAIL_CODE_TTL_SECONDS = 300;

export function SignupForm() {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const [formError, setFormError] = useState<string | null>(null);
  const [verifiedToken, setVerifiedToken] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    setError,
    clearErrors,
    trigger,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
    defaultValues: {
      emailCode: "1234",
    },
  });

  const isEmailVerified = !!verifiedToken;
  const email = useWatch({ control, name: "email" });
  const previousEmailRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(EMAIL_CODE_TTL_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetEmailVerification = useCallback(() => {
    setVerifiedToken("");
    setCodeSent(false);
    setCountdown(0);
    setValue("emailCode", "1234");
    clearErrors("emailCode");
    if (timerRef.current) clearInterval(timerRef.current);
  }, [clearErrors, setValue]);

  useEffect(() => {
    if (previousEmailRef.current === undefined) {
      previousEmailRef.current = email;
      return;
    }
    if (previousEmailRef.current !== email) {
      previousEmailRef.current = email;
      resetEmailVerification();
    }
  }, [email, resetEmailVerification]);

  const formatCountdown = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const emailCodeField = register("emailCode", {
    onChange: (event) => {
      const value = event.target.value.replace(/\D/g, "").slice(0, 6);
      setValue("emailCode", value, { shouldValidate: value.length === 6 });
    },
  });

  const handleSendCode = async () => {
    setFormError(null);
    const validEmail = await trigger("email");
    if (!validEmail) return;

    const email = getValues("email");
    setIsSendingCode(true);
    try {
      const available = await authApi.checkEmail(email);
      if (!available) {
        setError("email", { type: "server", message: t("duplicateEmail") });
        return;
      }

      await authApi.sendEmailCode({ email });
      setVerifiedToken("");
      setCodeSent(true);
      setValue("emailCode", "1234");
      clearErrors("emailCode");
      startCountdown();
      toast.success(t("codeSent"));
    } catch (e) {
      const apiError = getApiError(e);
      if (apiError?.code === "AUTH_001") {
        setError("email", { type: "server", message: apiError.message });
      } else {
        toast.error(apiError?.message ?? t("codeSendFailed"));
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    setFormError(null);
    const validEmail = await trigger("email");
    const validCode = await trigger("emailCode");
    if (!validEmail || !validCode) return;

    setIsVerifyingCode(true);
    try {
      const res = await authApi.verifyEmailCode({
        email: getValues("email"),
        code: getValues("emailCode"),
      });
      setVerifiedToken(res.verifiedToken);
      if (timerRef.current) clearInterval(timerRef.current);
      setCountdown(0);
      clearErrors("emailCode");
      toast.success(t("emailVerified"));
    } catch (e) {
      const apiError = getApiError(e);
      setError("emailCode", { type: "server", message: apiError?.message ?? t("codeInvalid") });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    if (!verifiedToken) {
      setError("emailCode", { type: "manual", message: "emailVerificationRequired" });
      return;
    }

    try {
      await authActions.signup(values.email, values.password, values.username, verifiedToken);
      toast.success(t("signupSuccess"));
      router.replace("/dashboard");
    } catch (e) {
      const apiError = getApiError(e);
      const fields = getFieldErrors(e);

      (Object.keys(fields) as Array<keyof SignupFormValues>).forEach((k) => {
        setError(k, { type: "server", message: fields[k as string] });
      });

      if (apiError && Object.keys(fields).length === 0) {
        if (apiError.code === "AUTH_001") {
          setError("email", { type: "server", message: apiError.message });
        } else {
          setFormError(apiError.message);
        }
      } else if (!apiError) {
        setFormError(t("signupFailed"));
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      <FormField label={t("email")} htmlFor="signup-email" error={errors.email?.message}>
        <div className="flex gap-2">
          <TextInput
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            invalid={!!errors.email}
            aria-invalid={!!errors.email}
            disabled={isEmailVerified}
            className="min-w-0 flex-1"
            {...register("email")}
          />
          {isEmailVerified ? (
            <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {t("verified")}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isSendingCode}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
            >
              <MailCheck className="h-4 w-4" />
              {isSendingCode ? t("sendingCode") : codeSent ? t("resendCode") : t("sendCode")}
            </button>
          )}
        </div>
      </FormField>

      {codeSent && !isEmailVerified && (
        <FormField
          label={t("emailCode")}
          htmlFor="signup-email-code"
          error={errors.emailCode?.message}
        >
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <TextInput
                id="signup-email-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder={t("emailCodePlaceholder")}
                invalid={!!errors.emailCode}
                aria-invalid={!!errors.emailCode}
                className="pr-16"
                {...emailCodeField}
              />
              {countdown > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground">
                  {formatCountdown(countdown)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={isVerifyingCode}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isVerifyingCode ? t("verifyingCode") : t("verifyCode")}
            </button>
          </div>
          {countdown === 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("codeExpired")}{" "}
              <button type="button" onClick={handleSendCode} className="underline hover:text-foreground">
                {t("resendCode")}
              </button>
            </p>
          )}
        </FormField>
      )}

      {isEmailVerified && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{t("emailVerified")}</span>
        </div>
      )}

      <FormField label={t("username")} htmlFor="signup-username" error={errors.username?.message}>
        <TextInput
          id="signup-username"
          type="text"
          autoComplete="name"
          placeholder={t("usernamePlaceholder")}
          invalid={!!errors.username}
          aria-invalid={!!errors.username}
          disabled={!isEmailVerified}
          {...register("username")}
        />
      </FormField>

      <FormField
        label={t("password")}
        htmlFor="signup-password"
        error={errors.password?.message}
        hint={errors.password ? undefined : t("passwordPlaceholder")}
      >
        <PasswordInput
          id="signup-password"
          autoComplete="new-password"
          placeholder="••••••••"
          invalid={!!errors.password}
          aria-invalid={!!errors.password}
          disabled={!isEmailVerified}
          {...register("password")}
        />
      </FormField>

      <FormField
        label={t("passwordConfirm")}
        htmlFor="signup-password-confirm"
        error={errors.passwordConfirm?.message}
      >
        <PasswordInput
          id="signup-password-confirm"
          autoComplete="new-password"
          placeholder={t("passwordConfirmPlaceholder")}
          invalid={!!errors.passwordConfirm}
          aria-invalid={!!errors.passwordConfirm}
          disabled={!isEmailVerified}
          {...register("passwordConfirm")}
        />
      </FormField>

      <button
        type="submit"
        disabled={isSubmitting || !isEmailVerified}
        className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-medium disabled:opacity-60 hover:opacity-90 transition-opacity"
      >
        <UserPlus className="h-4 w-4" />
        {isSubmitting ? t("signingUp") : t("signUpButton")}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link href="/login" className="underline hover:text-foreground">
          {t("signInLink")}
        </Link>
      </p>
    </form>
  );
}
