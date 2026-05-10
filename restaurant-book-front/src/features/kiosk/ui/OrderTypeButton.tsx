import type { ComponentType } from "react";

export function OrderTypeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-14 items-center justify-center gap-2 rounded-md border text-base font-bold transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-accent"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}
