"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from "@/shared/i18n";

export function LanguageSelect() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored) && stored !== i18n.language) {
        void i18n.changeLanguage(stored as LanguageCode);
      }
    } catch {
      /* ignore */
    }
  }, [i18n]);

  const currentCode = (i18n.language as LanguageCode) ?? "ko";
  const current =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentCode) ??
    SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const change = (code: LanguageCode) => {
    void i18n.changeLanguage(code);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Language"
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-2.5 text-foreground transition-colors hover:bg-accent"
      >
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span
          className="hidden sm:inline text-sm font-medium leading-none"
          suppressHydrationWarning
        >
          {mounted ? current.short : "KO"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 rounded-md border border-border bg-background shadow-lg z-50 py-1 overflow-hidden">
          {SUPPORTED_LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => change(l.code)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground">
                  {l.short}
                </span>
                <span>{l.label}</span>
              </span>
              {currentCode === l.code && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
