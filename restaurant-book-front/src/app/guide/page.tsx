"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/entities/user/model/authStore";
import {
  ShoppingBag,
  Utensils,
  BadgeCheck,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

const flowNodes = [
  { key: "customer", href: "/guide/customer", icon: ShoppingBag, color: "text-emerald-600 dark:text-emerald-400" },
  { key: "kitchen",  href: "/guide/kitchen",  icon: Utensils,    color: "text-amber-600  dark:text-amber-400" },
  { key: "staff",    href: "/guide/staff",    icon: BadgeCheck,  color: "text-indigo-600 dark:text-indigo-400" },
  { key: "complete", href: null,              icon: CheckCircle2, color: "text-muted-foreground" },
] as const;

type RoleKey = "customer" | "kitchen" | "staff";

const roleCards: { key: RoleKey; href: string; accent: string; stepKeys: string[] }[] = [
  {
    key: "customer",
    href: "/guide/customer",
    accent: "emerald",
    stepKeys: ["step1", "step2", "step3"],
  },
  {
    key: "kitchen",
    href: "/guide/kitchen",
    accent: "amber",
    stepKeys: ["step1", "step2", "step3"],
  },
  {
    key: "staff",
    href: "/guide/staff",
    accent: "indigo",
    stepKeys: ["step1", "step2", "step3", "step4"],
  },
];

const accentMap = {
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: "bg-emerald-500 text-white",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    highlight: "ring-2 ring-emerald-400",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: "bg-amber-500 text-white",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    highlight: "ring-2 ring-amber-400",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    border: "border-indigo-200 dark:border-indigo-800",
    icon: "bg-indigo-500 text-white",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
    highlight: "ring-2 ring-indigo-400",
  },
};

const roleIconMap: Record<RoleKey, React.ElementType> = {
  customer: ShoppingBag,
  kitchen: Utensils,
  staff: BadgeCheck,
};

const roleToCardKey: Record<string, RoleKey> = {
  ROLE_CUSTOMER: "customer",
  ROLE_KITCHEN: "kitchen",
  ROLE_STAFF: "staff",
  ROLE_MANAGER: "staff",
};

const adminLinks = [
  { href: "/dashboard",            labelKey: "admin.dashboard" },
  { href: "/orders",               labelKey: "admin.orders" },
  { href: "/kitchen-board",        labelKey: "admin.kitchen" },
  { href: "/sales",                labelKey: "admin.sales" },
  { href: "/sale-menus",           labelKey: "admin.menus" },
  { href: "/sale-menu-sets",       labelKey: "admin.menuSets" },
  { href: "/sale-menu-categories", labelKey: "admin.categories" },
  { href: "/sale-menu-availability", labelKey: "admin.availability" },
  { href: "/users",                labelKey: "admin.users" },
  { href: "/roles",                labelKey: "admin.roles" },
  { href: "/role-permissions",     labelKey: "admin.rolePermissions" },
  { href: "/site-settings",        labelKey: "admin.siteSettings" },
  { href: "/screen-settings",      labelKey: "admin.screenSettings" },
  { href: "/navigation-menus",     labelKey: "admin.navMenus" },
];

export default function GuidePage() {
  const { t } = useTranslation("guide");
  const { user } = useAuth();
  const myRoleKey = user?.role?.code ? roleToCardKey[user.role.code] ?? null : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("hero.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">{t("hero.subtitle")}</p>
      </div>

      {/* Order Flow */}
      <div className="mb-14 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {flowNodes.map((node, i) => {
          const Icon = node.icon;
          const isLast = i === flowNodes.length - 1;
          const content = (
            <div
              className={`flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background px-5 py-4 shadow-sm transition-colors ${
                node.href ? "hover:bg-accent cursor-pointer" : ""
              }`}
            >
              <Icon className={`h-6 w-6 ${node.color}`} />
              <span className="text-xs font-medium text-foreground">
                {t(`flow.${node.key}`)}
              </span>
            </div>
          );

          return (
            <div key={node.key} className="flex flex-col items-center gap-3 sm:flex-row">
              {node.href ? <Link href={node.href}>{content}</Link> : content}
              {!isLast && (
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block rotate-0" />
              )}
              {!isLast && (
                <ChevronDown className="block h-4 w-4 shrink-0 text-muted-foreground sm:hidden" />
              )}
            </div>
          );
        })}
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {roleCards.map((card) => {
          const accent = accentMap[card.accent as keyof typeof accentMap];
          const Icon = roleIconMap[card.key];
          const isMyRole = myRoleKey === card.key;

          return (
            <Link
              key={card.key}
              href={card.href}
              className={`group relative flex flex-col rounded-xl border ${accent.border} ${accent.bg} p-5 transition-all hover:shadow-md ${
                isMyRole ? accent.highlight : ""
              }`}
            >
              {isMyRole && (
                <span
                  className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold ${accent.badge}`}
                >
                  {t("cards.yourRoleBadge")}
                </span>
              )}
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${accent.icon}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-foreground">
                {t(`cards.${card.key}.title`)}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {t(`cards.${card.key}.desc`)}
              </p>
              <ol className="mt-4 space-y-1.5">
                {card.stepKeys.map((step) => (
                  <li key={step} className="flex items-start gap-2 text-xs text-foreground/80">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-background/70 text-[10px] font-bold text-muted-foreground ring-1 ring-border">
                      {step.replace("step", "")}
                    </span>
                    {t(`cards.${card.key}.${step}`)}
                  </li>
                ))}
              </ol>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {t("cards.detailLink")} <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          );
        })}
      </div>

      {/* Admin Menu List */}
      <section className="relative mt-12 rounded-xl border border-border px-5 pb-5 pt-8">
        <span className="absolute left-4 top-0 -translate-y-1/2 rounded-full border border-border bg-background px-3 py-0.5 text-xs font-semibold text-muted-foreground">
          {t("admin.summary")}
        </span>
        <ul className="grid gap-2 sm:grid-cols-2">
          {adminLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
              >
                {t(link.labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
