"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const EMPTY_VALUE = "__empty__";

export type SelectInputOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

type SelectInputProps = {
  value: string;
  options: SelectInputOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  "aria-label"?: string;
  className?: string;
  contentClassName?: string;
  size?: "sm" | "md";
};

export function SelectInput({
  value,
  options,
  onValueChange,
  placeholder,
  disabled,
  invalid,
  "aria-label": ariaLabel,
  className,
  contentClassName,
  size = "md",
}: SelectInputProps) {
  const hasEmptyOption = options.some((option) => option.value === "");
  const radixValue = value === "" && !hasEmptyOption ? "" : toRadixValue(value);
  const selectedOption = options.find((o) => toRadixValue(o.value) === radixValue);

  return (
    <SelectPrimitive.Root
      value={radixValue}
      onValueChange={(nextValue) => onValueChange(fromRadixValue(nextValue))}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md border bg-background text-left text-sm outline-none transition-colors",
          "focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60",
          size === "sm" ? "h-8 px-2.5" : "h-10 px-3",
          invalid ? "border-destructive/60 focus:ring-destructive/30" : "border-input",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder}>
          {selectedOption?.label}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            "z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border bg-background shadow-lg",
            contentClassName,
          )}
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={toRadixValue(option.value)}
                disabled={option.disabled}
                className={cn(
                  "relative flex cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none transition-colors",
                  "focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                )}
              >
                <SelectPrimitive.ItemIndicator className="absolute left-2 flex h-4 w-4 items-center justify-center">
                  <Check className="h-4 w-4" />
                </SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

function toRadixValue(value: string) {
  return value === "" ? EMPTY_VALUE : value;
}

function fromRadixValue(value: string) {
  return value === EMPTY_VALUE ? "" : value;
}
