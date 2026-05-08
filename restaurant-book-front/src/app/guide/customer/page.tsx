"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ShoppingBag, Utensils, BadgeCheck, ChevronRight } from "lucide-react";

const situations = ["s1", "s2", "s3"] as const;
const steps = ["step1", "step2", "step3", "step4", "step5"] as const;

const otherRoles = [
  { key: "kitchen", href: "/guide/kitchen", icon: Utensils,    accent: "text-amber-600 dark:text-amber-400" },
  { key: "staff",   href: "/guide/staff",   icon: BadgeCheck,  accent: "text-indigo-600 dark:text-indigo-400" },
] as const;

export default function CustomerGuidePage() {
  const { t } = useTranslation("guide");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/guide" className="hover:text-foreground transition-colors">{t("switcher.backToGuide")}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">{t("customer.title")}</span>
      </nav>

      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("customer.title")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("customer.lead")}</p>
        </div>
      </div>

      {/* Screenshot placeholder */}
      <div className="mb-8 overflow-hidden rounded-xl border border-border bg-muted/30">
        <div className="flex aspect-video items-center justify-center">
          <div className="text-center text-muted-foreground">
            <ShoppingBag className="mx-auto mb-2 h-10 w-10 opacity-30" />
            <p className="text-xs">{t("customer.screenshotCaption")}</p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <section className="mb-8">
        <h2 className="mb-4 text-base font-semibold">작업 순서</h2>
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-4 rounded-lg border border-border bg-background p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t(`customer.steps.${step}Title`)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t(`customer.steps.${step}Desc`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Situations */}
      <section className="mb-10">
        <h2 className="mb-4 text-base font-semibold">자주 만나는 상황</h2>
        <ul className="space-y-2">
          {situations.map((s) => (
            <li key={s} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              {t(`customer.situations.${s}`)}
            </li>
          ))}
        </ul>
      </section>

      {/* Role Switcher */}
      <section className="rounded-xl border border-border bg-muted/20 p-5">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t("switcher.title")}</h2>
        <div className="flex flex-wrap gap-3">
          {otherRoles.map((role) => {
            const Icon = role.icon;
            return (
              <Link
                key={role.key}
                href={role.href}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                <Icon className={`h-4 w-4 ${role.accent}`} />
                {t(`cards.${role.key}.title`)}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
