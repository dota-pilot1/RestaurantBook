"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  ClipboardList,
  Eye,
  LayoutDashboard,
  Menu,
  MonitorCog,
  Package,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  Utensils,
} from "lucide-react";
import { navigationMenuApi } from "@/entities/navigation-menu/api/navigationMenuApi";
import { permissionApi } from "@/entities/permission/api/permissionApi";
import { roleApi } from "@/entities/user/api/roleApi";
import { userApi } from "@/entities/user/api/userApi";

const adminSections = [
  {
    title: "사람·권한",
    description: "계정, 역할, 권한 매핑을 관리합니다.",
    links: [
      { href: "/users", label: "유저 관리", icon: Users },
      { href: "/roles", label: "롤 관리", icon: Shield },
      { href: "/role-permissions", label: "역할-권한 매핑", icon: ShieldCheck },
      { href: "/permissions", label: "권한 관리", icon: BadgeCheck },
    ],
  },
  {
    title: "상품·키오스크",
    description: "판매 메뉴와 고객 화면 노출 정보를 관리합니다.",
    links: [
      { href: "/sale-menus", label: "판매 메뉴 관리", icon: ShoppingBag },
      { href: "/sale-menu-sets", label: "세트 메뉴 관리", icon: Package },
      { href: "/sale-menu-categories", label: "카테고리 관리", icon: Utensils },
      { href: "/sale-menu-availability", label: "품절/노출 관리", icon: Eye },
    ],
  },
  {
    title: "설정",
    description: "매장 기본값과 관리자 메뉴 구조를 관리합니다.",
    links: [
      { href: "/site-settings", label: "매장 설정", icon: Store },
      { href: "/screen-settings", label: "화면 설정", icon: MonitorCog },
      { href: "/navigation-menus", label: "내비게이션 메뉴", icon: Menu },
    ],
  },
];

const operationLinks = [
  { href: "/manager", label: "매니저 대시보드", icon: LayoutDashboard },
  { href: "/sales", label: "매출 상세", icon: BarChart3 },
  { href: "/kitchen-board", label: "주방 현황", icon: Utensils },
  { href: "/staff", label: "직원 주문 보드", icon: ClipboardList },
];

export function AdminDashboard() {
  const { data: users } = useQuery({
    queryKey: ["users", "admin-dashboard"],
    queryFn: () => userApi.list(0, 20),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: roleApi.list,
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => permissionApi.list(),
  });

  const { data: navigationMenus = [] } = useQuery({
    queryKey: ["navigation-menus"],
    queryFn: navigationMenuApi.getAll,
  });

  const inactiveUsers = users?.content.filter((user) => !user.active).length ?? 0;
  const systemRoleCount = roles.filter((role) => role.systemRole).length;
  const visibleMenuCount = navigationMenus.filter((menu) => menu.visible).length;

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-4 py-5">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="flex flex-col gap-4 rounded-lg border border-border bg-background p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Settings className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">관리자 콘솔</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                계정, 권한, 메뉴, 화면 설정을 관리합니다. 매장 운영 현황은 매니저 대시보드에서 확인합니다.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/manager"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              <LayoutDashboard className="h-4 w-4" />
              매니저 대시보드
            </Link>
            <Link
              href="/site-settings"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Store className="h-4 w-4" />
              매장 설정
            </Link>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="전체 유저"
            value={`${users?.totalElements ?? 0}명`}
            delta={`비활성 ${inactiveUsers}명`}
            icon={Users}
            href="/users"
          />
          <MetricCard
            label="롤"
            value={`${roles.length}개`}
            delta={`시스템 ${systemRoleCount}개`}
            icon={Shield}
            href="/roles"
          />
          <MetricCard
            label="권한"
            value={`${permissions.length}개`}
            delta="권한 매핑 관리"
            icon={ShieldCheck}
            href="/permissions"
          />
          <MetricCard
            label="내비게이션"
            value={`${navigationMenus.length}개`}
            delta={`노출 ${visibleMenuCount}개`}
            icon={Menu}
            href="/navigation-menus"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          {adminSections.map((section) => (
            <div key={section.title} className="rounded-lg border border-border bg-background">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-sm font-bold">{section.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{section.description}</p>
              </div>
              <div className="grid gap-2 p-4">
                {section.links.map((item) => (
                  <AdminLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-bold">운영 화면 바로가기</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                관리자 권한으로 운영 화면을 조회하거나 필요한 작업을 확인합니다.
              </p>
            </div>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
            {operationLinks.map((item) => (
              <QuickLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  href,
}: {
  label: string;
  value: string;
  delta: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-lg border border-border bg-background p-4 transition-colors hover:bg-accent">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <strong className="text-2xl font-bold tracking-tight">{value}</strong>
        <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
          {delta}
        </span>
      </div>
    </Link>
  );
}

function AdminLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5 transition-colors hover:bg-accent"
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">{label}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function QuickLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex h-14 items-center justify-between rounded-lg border border-border bg-background px-4 text-sm font-semibold transition-colors hover:bg-accent"
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
