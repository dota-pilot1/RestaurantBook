"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";

type Tone = "success" | "info" | "error";

type Props = {
  open: boolean;
  title: string;
  tone?: Tone;
  confirmText?: string;
  children?: React.ReactNode;
  onConfirm: () => void;
};

const toneStyles: Record<Tone, { icon: React.ComponentType<{ className?: string }>; wrap: string; iconClass: string }> = {
  success: {
    icon: CheckCircle2,
    wrap: "bg-emerald-50 text-emerald-700",
    iconClass: "text-emerald-600",
  },
  info: {
    icon: Info,
    wrap: "bg-blue-50 text-blue-700",
    iconClass: "text-blue-600",
  },
  error: {
    icon: XCircle,
    wrap: "bg-red-50 text-red-700",
    iconClass: "text-red-600",
  },
};

export function NoticeDialog({
  open,
  title,
  tone = "info",
  confirmText = "확인",
  children,
  onConfirm,
}: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => btnRef.current?.focus(), 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === "Escape") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onConfirm]);

  if (!open) return null;

  const styles = toneStyles[tone];
  const Icon = styles.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
    >
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-border bg-background shadow-xl">
        <div className={`flex items-center gap-3 px-5 py-4 ${styles.wrap}`}>
          <Icon className={`h-6 w-6 shrink-0 ${styles.iconClass}`} />
          <h2 id="notice-dialog-title" className="text-lg font-black tracking-tight">
            {title}
          </h2>
        </div>
        {children && <div className="p-5">{children}</div>}
        <div className="border-t border-border bg-muted/20 px-5 py-4">
          <button
            ref={btnRef}
            type="button"
            onClick={onConfirm}
            className="flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
