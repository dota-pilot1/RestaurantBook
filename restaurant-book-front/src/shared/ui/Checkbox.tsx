"use client";

import { Check, Minus } from "lucide-react";
import { cn } from "@/shared/lib/utils";

type CheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
};

export function Checkbox({
  checked,
  onCheckedChange,
  indeterminate = false,
  disabled = false,
  "aria-label": ariaLabel,
  className,
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-primary-foreground outline-none transition-colors",
        "focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
        checked || indeterminate
          ? "border-primary bg-primary"
          : "border-input bg-background hover:bg-accent",
        className,
      )}
    >
      {indeterminate ? (
        <Minus className="h-3 w-3" />
      ) : checked ? (
        <Check className="h-3 w-3" />
      ) : null}
    </button>
  );
}
