"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Banknote,
  BarChart3,
  ChefHat,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  PackageCheck,
  PhoneCall,
  ReceiptText,
  ShoppingBag,
  Store,
  Utensils,
} from "lucide-react";
import { managerApi } from "@/entities/manager/api/managerApi";
import { useOperationalOrdersWebSocket } from "@/entities/order/api/orderRealtime";
import { paymentApi } from "@/entities/payment/api/paymentApi";
import type { PaymentMethod } from "@/entities/payment/model/types";
import { useOperationsStaffCallsWebSocket } from "@/entities/staff-call/api/staffCallRealtime";
import { RequireRole } from "@/widgets/guards/RequireRole";

const formatPrice = (value: number) => `${value.toLocaleString("ko-KR")}원`;

const methodLabel: Record<PaymentMethod, string> = {
  CARD: "카드",
  CASH: "현금",
  ETC: "기타",
};

const methodIcon: Record<PaymentMethod, React.ComponentType<{ className?: string }>> = {
  CARD: CreditCard,
  CASH: Banknote,
  ETC: ReceiptText,
};

export default function ManagerPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
      <ManagerDashboardContent />
    </RequireRole>
  );
}

function ManagerDashboardContent() {
  useOperationalOrdersWebSocket();
  useOperationsStaffCallsWebSocket();

  const { data: dashboard } = useQuery({
    queryKey: ["manager-dashboard"],
    queryFn: managerApi.getDashboard,
    refetchOnWindowFocus: true,
  });

  const { data: todaySales } = useQuery({
    queryKey: ["sales", "today-summary"],
    queryFn: paymentApi.getTodaySalesSummary,
    refetchOnWindowFocus: true,
  });

  const receivedAndAccepted = (dashboard?.receivedCount ?? 0) + (dashboard?.acceptedCount ?? 0);
  const inProgress = receivedAndAccepted + (dashboard?.cookingCount ?? 0);
  const readyCount = dashboard?.readyCount ?? 0;
  const paymentCount = todaySales?.paymentCount ?? 0;
  const netAmount = (todaySales?.totalAmount ?? 0) - (todaySales?.refundAmount ?? 0);
  const pendingStaffCallCount = dashboard?.pendingStaffCallCount ?? 0;

  const flowStages = [
    { label: "접수", value: receivedAndAccepted, tone: "bg-blue-500" },
    { label: "조리 중", value: dashboard?.cookingCount ?? 0, tone: "bg-amber-500" },
    { label: "조리 완료", value: readyCount, tone: "bg-emerald-500" },
    { label: "취소", value: dashboard?.canceledTodayCount ?? 0, tone: "bg-red-500" },
  ];

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-4 py-5">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="flex flex-col gap-4 rounded-lg border border-border bg-background p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <LayoutDashboard className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">매니저 대시보드</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                오늘 주문, 결제, 주방 흐름을 실데이터 기준으로 확인합니다.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickButton href="/staff" label="직원 보드" icon={ClipboardList} />
            <QuickButton href="/kitchen-board" label="주방 현황" icon={ChefHat} />
            <QuickButton href="/sales" label="매출 통계" icon={BarChart3} primary />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="오늘 주문"
            value={`${dashboard?.todayOrderCount ?? 0}건`}
            delta={`진행 ${inProgress}건`}
            icon={ShoppingBag}
          />
          <MetricCard
            label="오늘 매출"
            value={formatPrice(todaySales?.totalAmount ?? 0)}
            delta={`결제 ${paymentCount}건`}
            icon={CreditCard}
            href="/sales"
          />
          <MetricCard
            label="결제 대기"
            value={`${readyCount}건`}
            delta="조리 완료"
            icon={PackageCheck}
            href="/staff"
          />
          <MetricCard
            label="오늘 순매출"
            value={formatPrice(netAmount)}
            delta={`환불 ${todaySales?.refundCount ?? 0}건`}
            icon={BarChart3}
            href="/sales"
            tone={netAmount < 0 ? "alert" : undefined}
          />
          <MetricCard
            label="직원 호출"
            value={`${pendingStaffCallCount}건`}
            delta={pendingStaffCallCount > 0 ? "응대 대기" : "없음"}
            icon={PhoneCall}
            href="/staff"
            tone={pendingStaffCallCount > 0 ? "alert" : undefined}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">실시간 주문 흐름</h2>
              </div>
              <span className="text-xs font-medium text-muted-foreground">현재 상태</span>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-4">
              {flowStages.map((stage) => (
                <div key={stage.label} className="rounded-md border border-border p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`h-2.5 w-2.5 rounded-full ${stage.tone}`} />
                    <span className="text-xs text-muted-foreground">주문</span>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{stage.label}</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight">{stage.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">오늘 결제수단</h2>
              </div>
              <Link href="/sales" className="text-xs font-bold text-muted-foreground hover:text-foreground">
                통계 보기
              </Link>
            </div>
            <div className="space-y-3 p-4">
              {(todaySales?.methodSummaries ?? []).map((summary) => {
                const Icon = methodIcon[summary.method];
                return (
                  <div key={summary.method} className="flex items-center justify-between rounded-md border border-border px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-bold">{methodLabel[summary.method]}</p>
                        <p className="text-xs text-muted-foreground">{summary.count}건</p>
                      </div>
                    </div>
                    <p className="font-black tabular-nums">{formatPrice(summary.amount)}</p>
                  </div>
                );
              })}
              {(todaySales?.methodSummaries?.length ?? 0) === 0 ? (
                <p className="rounded-md border border-dashed border-border p-6 text-center text-sm font-semibold text-muted-foreground">
                  오늘 결제 기록이 없습니다.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickLink href="/kitchen-board" label="주방 현황" icon={ChefHat} />
          <QuickLink href="/staff" label="직원 주문 보드" icon={ClipboardList} />
          <QuickLink href="/sale-menu-availability" label="품절/노출 관리" icon={Utensils} />
          <QuickLink href="/customer" label="키오스크 보기" icon={Store} />
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
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  tone?: "alert";
}) {
  const containerClass =
    tone === "alert"
      ? "rounded-lg border border-rose-300 bg-rose-50 p-4 transition-colors hover:bg-rose-100"
      : "rounded-lg border border-border bg-background p-4 transition-colors hover:bg-accent";
  const iconClass = tone === "alert" ? "h-4 w-4 text-rose-700" : "h-4 w-4 text-muted-foreground";
  const deltaClass =
    tone === "alert"
      ? "rounded-md bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-800"
      : "rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground";
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Icon className={iconClass} />
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <strong className="text-2xl font-bold tracking-tight">{value}</strong>
        <span className={deltaClass}>{delta}</span>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={containerClass}>
        {content}
      </Link>
    );
  }

  return <div className={containerClass}>{content}</div>;
}

function QuickButton({
  href,
  label,
  icon: Icon,
  primary = false,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
        primary
          ? "bg-primary text-primary-foreground hover:opacity-90"
          : "border border-border bg-background hover:bg-accent"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
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
