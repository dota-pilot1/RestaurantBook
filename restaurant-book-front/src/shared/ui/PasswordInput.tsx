"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ invalid, className = "", ...rest }, ref) {
    const { t } = useTranslation("auth");
    const [visible, setVisible] = useState(false);

    const base =
      "w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm outline-none transition-colors focus:ring-2";
    const state = invalid
      ? "border-destructive/60 focus:ring-destructive/40"
      : "border-input focus:ring-ring";

    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={`${base} ${state} ${className}`}
          {...rest}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-2 flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="translate-y-px rounded-md p-1 hover:bg-accent">
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </span>
        </button>
      </div>
    );
  },
);
