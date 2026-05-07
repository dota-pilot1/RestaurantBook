"use client";

import Link from "next/link";
import { ClipboardList, CookingPot, LayoutDashboard, Settings, ShoppingBag, Users } from "lucide-react";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { useAuth } from "@/entities/user/model/authStore";
import { RoleBadge } from "@/features/user-management/RoleBadge";

type RoleHomeConfig = {
  roleCode: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  actions: Array<{ label: string; href: string }>;
};

const configs: Record<string, RoleHomeConfig> = {
  ROLE_MANAGER: {
    roleCode: "ROLE_MANAGER",
    title: "매니저 워크스페이스",
    description: "매장 운영 현황과 관리 업무를 확인하는 시작 화면입니다.",
    icon: LayoutDashboard,
    actions: [
      { label: "프로필 확인", href: "/profile" },
      { label: "대시보드", href: "/dashboard" },
    ],
  },
  ROLE_KITCHEN: {
    roleCode: "ROLE_KITCHEN",
    title: "주방 워크스페이스",
    description: "주문 접수와 조리 상태 관리 기능을 붙여갈 역할별 화면입니다.",
    icon: CookingPot,
    actions: [
      { label: "프로필 확인", href: "/profile" },
      { label: "대시보드", href: "/dashboard" },
    ],
  },
  ROLE_STAFF: {
    roleCode: "ROLE_STAFF",
    title: "직원 워크스페이스",
    description: "현장 주문과 고객 응대 업무를 확인하는 시작 화면입니다.",
    icon: ClipboardList,
    actions: [
      { label: "프로필 확인", href: "/profile" },
      { label: "대시보드", href: "/dashboard" },
    ],
  },
  ROLE_CUSTOMER: {
    roleCode: "ROLE_CUSTOMER",
    title: "고객 마이페이지",
    description: "주문 내역과 즐겨찾기 기능을 확장할 고객용 시작 화면입니다.",
    icon: ShoppingBag,
    actions: [
      { label: "내 프로필", href: "/profile" },
      { label: "대시보드", href: "/dashboard" },
    ],
  },
};

export function RoleHome({ roleCode }: { roleCode: keyof typeof configs }) {
  const config = configs[roleCode];

  return (
    <RequireRole roles={[config.roleCode]}>
      <RoleHomeContent config={config} />
    </RequireRole>
  );
}

function RoleHomeContent({ config }: { config: RoleHomeConfig }) {
  const { user } = useAuth();
  const Icon = config.icon;

  return (
    <main className="w-full px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="flex flex-col gap-4 rounded-lg border border-border bg-background p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{config.title}</h1>
                {user?.role && <RoleBadge role={user.role} />}
              </div>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {config.actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <StatusTile label="계정" value={user?.username ?? "-"} />
          <StatusTile label="이메일" value={user?.email ?? "-"} />
          <StatusTile label="권한 수" value={`${user?.permissions.length ?? 0}개`} />
        </section>

        <section className="rounded-lg border border-border">
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">역할별 기능 슬롯</h2>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <Placeholder title="운영 요약" />
            <Placeholder title="최근 작업" />
            <Placeholder title="알림" />
            <Placeholder title="빠른 실행" />
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex min-h-24 items-center gap-3 rounded-md border border-dashed border-border bg-muted/20 px-4 py-3">
      <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
    </div>
  );
}
