"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  CreditCard,
  Eye,
  LayoutDashboard,
  Package,
  Plus,
  QrCode,
  Settings,
  ShoppingBag,
  Store,
  Users,
  Utensils,
} from "lucide-react";

const stats = [
  { label: "오늘 주문", value: "128건", delta: "+18%", icon: ShoppingBag },
  { label: "오늘 매출", value: "1,482,000원", delta: "+12%", icon: CreditCard },
  { label: "대기 주문", value: "7건", delta: "조리 4건", icon: ClipboardList },
  { label: "판매 메뉴", value: "42개", delta: "품절 3개", icon: Utensils },
];

const orderStages = [
  { label: "접수", count: 12, tone: "bg-blue-500" },
  { label: "조리 중", count: 4, tone: "bg-amber-500" },
  { label: "완료", count: 19, tone: "bg-emerald-500" },
  { label: "취소", count: 1, tone: "bg-red-500" },
];

const menuTasks = [
  { label: "카테고리 등록", href: "/sale-menu-categories" },
  { label: "메뉴명/가격 관리", href: "/sale-menus" },
  { label: "세트 메뉴 관리", href: "/sale-menu-sets" },
  { label: "대표 이미지 연결", href: "/sale-menus" },
  { label: "품절/숨김 상태 변경", href: "/sale-menu-availability" },
  { label: "매장/포장 노출 설정", href: "/sale-menu-availability" },
];

export function AdminDashboard() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-4 py-5">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="flex flex-col gap-4 rounded-lg border border-border bg-background p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <LayoutDashboard className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">관리자 대시보드</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                키오스크 주문, 메뉴 데이터, 매장 운영 상태를 한 화면에서 확인합니다.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/customer"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              <Eye className="h-4 w-4" />
              키오스크 미리보기
            </Link>
            <Link
              href="/site-settings"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Settings className="h-4 w-4" />
              매장 설정
            </Link>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <strong className="text-2xl font-bold tracking-tight">{item.value}</strong>
                  <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                    {item.delta}
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-lg border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">실시간 주문 흐름</h2>
              </div>
              <span className="text-xs font-medium text-muted-foreground">최근 30분</span>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-4">
              {orderStages.map((stage) => (
                <div key={stage.label} className="rounded-md border border-border p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`h-2.5 w-2.5 rounded-full ${stage.tone}`} />
                    <span className="text-xs text-muted-foreground">주문</span>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{stage.label}</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight">{stage.count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">결제 상태</h2>
              </div>
              <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700">
                정상
              </span>
            </div>
            <div className="space-y-3 p-4">
              <StatusRow label="키오스크 결제" value="대기 없음" icon={BadgeCheck} />
              <StatusRow label="QR 간편결제" value="연동 예정" icon={QrCode} />
              <StatusRow label="현장 결제" value="사용 가능" icon={Store} />
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">키오스크 메뉴 데이터</h2>
              </div>
              <Link
                href="/sale-menus"
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-semibold text-primary-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                메뉴 추가
              </Link>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-sm text-muted-foreground">
                다음 단계에서 이 영역을 실제 메뉴/카테고리 CRUD와 연결하면 고객 키오스크 화면이 관리자 데이터로 채워집니다.
              </p>
              <div className="grid gap-2">
                {menuTasks.map((task) => (
                  <Link
                    key={task.label}
                    href={task.href}
                    className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 transition-colors hover:bg-accent"
                  >
                    <span className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{task.label}</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">운영 체크리스트</h2>
              </div>
              <span className="text-xs font-medium text-muted-foreground">오늘</span>
            </div>
            <div className="divide-y divide-border">
              <ChecklistItem title="품절 메뉴 확인" description="반찬 2개, 음료 1개가 품절 상태입니다." />
              <ChecklistItem title="대표 메뉴 이미지 보강" description="고객 키오스크 카드에 사용할 이미지를 연결합니다." />
              <ChecklistItem title="매장/포장 가격 정책 확인" description="포장 할인 또는 포장 불가 메뉴 정책을 정리합니다." />
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickLink href="/users" label="유저 관리" icon={Users} />
          <QuickLink href="/roles" label="롤 관리" icon={BadgeCheck} />
          <QuickLink href="/site-settings" label="메인 관리" icon={Settings} />
          <QuickLink href="/customer" label="키오스크 보기" icon={Package} />
        </section>
      </div>
    </main>
  );
}

function StatusRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  );
}

function ChecklistItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        className="mt-0.5 inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-border px-2 text-xs font-medium transition-colors hover:bg-accent"
      >
        확인
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
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
