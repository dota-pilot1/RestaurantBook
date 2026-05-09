import type { LucideIcon } from "lucide-react";

type ToggleOption<T extends string> = {
  value: T;
  icon: LucideIcon;
  label?: string;
  ariaLabel?: string;
};

type ViewToggleProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: ToggleOption<T>[];
};

export function ViewToggle<T extends string>({ value, onChange, options }: ViewToggleProps<T>) {
  return (
    <div className="inline-flex items-stretch gap-1 rounded-md border border-input bg-background p-1">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
            aria-label={option.ariaLabel ?? option.label}
            aria-pressed={isActive}
          >
            <Icon className="h-3.5 w-3.5" />
            {option.label && <span>{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
