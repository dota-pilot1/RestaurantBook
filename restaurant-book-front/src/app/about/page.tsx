import Link from "next/link";
import {
  ShoppingBag,
  Utensils,
  BadgeCheck,
  ArrowRight,
  QrCode,
  CreditCard,
  Bell,
  ChefHat,
  LogIn,
} from "lucide-react";

const steps = [
  {
    icon: QrCode,
    title: "QR 스캔으로 주문 시작",
    desc: "테이블의 QR 코드를 스캔하면 키오스크 메뉴가 바로 열립니다. 앱 설치 없이 브라우저에서 즉시 주문할 수 있습니다.",
    accent: "bg-emerald-500",
  },
  {
    icon: ShoppingBag,
    title: "메뉴 선택 & 장바구니",
    desc: "카테고리별로 메뉴를 탐색하고 수량을 조절한 뒤 주문합니다. 매장/포장 여부도 선택할 수 있습니다.",
    accent: "bg-emerald-500",
  },
  {
    icon: ChefHat,
    title: "주방 자동 접수",
    desc: "주문이 접수되면 주방 화면에 즉시 표시됩니다. 주방 직원이 조리를 시작하면 상태가 실시간으로 업데이트됩니다.",
    accent: "bg-amber-500",
  },
  {
    icon: Bell,
    title: "준비 완료 알림",
    desc: "음식이 준비되면 직원이 고객을 호출합니다. 고객은 자리에서 편하게 기다리면 됩니다.",
    accent: "bg-indigo-500",
  },
  {
    icon: CreditCard,
    title: "간편 결제",
    desc: "카드, 현금 등 다양한 결제 수단을 지원합니다. 결제가 완료되면 주문이 마무리됩니다.",
    accent: "bg-indigo-500",
  },
];

const roles = [
  {
    icon: ShoppingBag,
    title: "고객",
    desc: "QR 스캔 → 메뉴 선택 → 주문 → 대기",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  {
    icon: Utensils,
    title: "주방",
    desc: "주문 접수 → 조리 → 준비 완료 처리",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
  },
  {
    icon: BadgeCheck,
    title: "직원",
    desc: "준비 완료 확인 → 결제 처리 → 호출 응답",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    border: "border-indigo-200 dark:border-indigo-800",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border bg-muted/20 px-4 py-16 text-center sm:py-24">
        <div className="mx-auto max-w-2xl">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <QrCode className="h-3.5 w-3.5" />
            QR 키오스크 주문 시스템
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            테이블에서 바로 주문하고<br />
            <span className="text-primary">빠르게 서빙</span>받으세요
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            RestaurantBook은 고객 QR 주문부터 주방 조리, 직원 서빙까지
            <br className="hidden sm:block" />
            전체 흐름을 하나의 시스템으로 연결합니다.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <LogIn className="h-4 w-4" />
              로그인하기
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              회원가입
            </Link>
          </div>
        </div>
      </section>

      {/* Order Flow Steps */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="mb-10 text-center text-lg font-bold tracking-tight">주문이 이루어지는 순서</h2>
        <ol className="space-y-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={i} className="flex gap-4 rounded-xl border border-border bg-background p-5">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${step.accent} text-white`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-foreground">
                    <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Roles */}
      <section className="border-t border-border bg-muted/20 px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-lg font-bold tracking-tight">역할별 담당 업무</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.title}
                  className={`rounded-xl border ${role.border} ${role.bg} p-5`}
                >
                  <Icon className={`mb-3 h-6 w-6 ${role.color}`} />
                  <h3 className="font-bold text-foreground">{role.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{role.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-14 text-center">
        <div className="mx-auto max-w-md">
          <h2 className="text-lg font-bold">지금 바로 시작해보세요</h2>
          <p className="mt-2 text-sm text-muted-foreground">계정이 있다면 로그인, 없다면 관리자에게 문의하세요.</p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            로그인하기 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
