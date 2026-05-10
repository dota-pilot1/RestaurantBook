import type { ReactNode } from "react";

export function QuantityButton({
  label,
  onClick,
  primary = false,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        primary
          ? "border-primary bg-primary text-primary-foreground hover:opacity-90"
          : "border-border bg-background text-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}
