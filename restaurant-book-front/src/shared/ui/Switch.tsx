"use client";

import { cn } from "@/shared/lib/utils";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex h-7 w-12 shrink-0 items-center rounded-full border p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-primary bg-primary" : "border-border bg-muted",
        className,
      )}
    >
      <span
        className={cn(
          "h-6 w-6 rounded-full bg-background shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}
