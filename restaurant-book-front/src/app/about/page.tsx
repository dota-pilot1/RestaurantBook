import Link from "next/link";
import {
  ShoppingBag,
  Utensils,
  BadgeCheck,
  ArrowRight,
  Tablet,
  CreditCard,
  Bell,
  ChefHat,
  LogIn,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
} from "lucide-react";

const steps = [
  {
    icon: Tablet,
    title: "테이블 키오스크에서 주문",
    desc: "테이블에 비치된 키오스크(태블릿)에서 메뉴를 탐색하고 수량을 선택합니다. 매장/포장 여부도 선택할 수 있습니다.",
    accent: "bg-emerald-500",
  },
  {
    icon: ShoppingBag,
    title: "주문 접수 & 직원 호출",
    desc: "주문을 완료하거나 직원을 호출할 수 있습니다. 필요 시 주문을 취소하는 것도 가능합니다.",
    accent: "bg-emerald-500",
  },
  {
    icon: ChefHat,
    title: "주방 자동 접수",
    desc: "주문이 들어오면 주방 화면에 즉시 표시됩니다. 주방 직원이 조리를 시작하면 상태가 업데이트됩니다.",
    accent: "bg-amber-500",
  },
  {
    icon: Bell,
    title: "준비 완료 & 서빙",
    desc: "음식이 준비되면 직원이 확인하고 고객에게 서빙합니다. 호출 알림에도 대응합니다.",
    accent: "bg-indigo-500",
  },
  {
    icon: CreditCard,
    title: "후불 결제 처리",
    desc: "식사 후 직원이 카드 또는 현금으로 결제를 처리합니다. 필요 시 환불도 가능합니다. (선불/간편결제는 추후 지원 예정)",
    accent: "bg-indigo-500",
  },
];

const roles = [
  {
    icon: ShoppingBag,
    title: "고객",
    desc: "키오스크 주문 → 직원 호출 → 서빙 대기",
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

const implemented = [
  "테이블 키오스크 주문 (태블릿)",
  "주방 주문 접수 및 조리 상태 관리",
  "직원 서빙 · 호출 응답",
  "후불 결제 (카드 / 현금) 및 환불",
  "관리자 대시보드 · 매출/환불 통계 · 주문 현황",
  "테이블 관리 및 기본 테이블 자동 생성",
  "메뉴 · 카테고리 · 세트메뉴 · 품절/노출 관리",
  "조리 불필요 메뉴 자동 준비 완료 처리",
  "판매 메뉴 · 세트메뉴 엑셀 다운로드",
  "키오스크 메뉴 선택 체크 배지",
  "공지사항 · 문의 게시판 및 관리자 답변 관리",
  "운영 캘린더 (휴무 · 프로모션 · 단체예약 메모)",
  "매장 · 화면 · 내비게이션 설정 관리",
  "사용 가이드 · 프로필 페이지",
  "역할 기반 접근 제어 (고객 / 주방 / 직원 / 관리자)",
  "다국어 지원 (한국어 · English · 日本語 · 中文)",
];

const planned = [
  "고객 후기 게시판 (평점 · 사진 · 방문 후기)",
  "후기 관리 기능 (노출 승인 · 신고 · 관리자 답글)",
  "챗봇 자동 응답 (영업시간 · 메뉴 · 예약 문의)",
  "예약 문의 접수 및 관리자 확인/답변",
  "카카오페이 간편결제 연동",
  "토스페이 간편결제 연동",
  "SMS 주문 알림 · 결제 문자 발송",
  "선불 결제 / 키오스크 자체 결제",
  "주문·매출 통계 고도화 (시간대별 · 메뉴별 · 재방문)",
  "테이블 QR 코드 기반 주문 지원",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border bg-muted/20 px-4 py-16 text-center sm:py-24">
        <div className="mx-auto max-w-2xl">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Tablet className="h-3.5 w-3.5" />
            테이블 키오스크 주문 시스템
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            테이블에서 바로 주문하고<br />
            <span className="text-primary">빠르게 서빙</span>받으세요
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            RestaurantBook은 테이블 키오스크 주문부터 주방 조리, 직원 서빙까지
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
                <div key={role.title} className={`rounded-xl border ${role.border} ${role.bg} p-5`}>
                  <Icon className={`mb-3 h-6 w-6 ${role.color}`} />
                  <h3 className="font-bold text-foreground">{role.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{role.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Implementation Status */}
      <section className="border-t border-border px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-lg font-bold tracking-tight">구현 현황</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Implemented */}
            <div className="rounded-xl border border-border bg-background p-5">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h3 className="font-semibold text-foreground">현재 구현 완료</h3>
              </div>
              <ul className="space-y-2">
                {implemented.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Planned */}
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold text-foreground">구현 예정</h3>
              </div>
              <ul className="space-y-2">
                {planned.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Contact */}
      <section className="border-t border-border bg-muted/20 px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-lg font-bold tracking-tight">개발자 소개</h2>
          <div className="mx-auto max-w-sm rounded-xl border border-border bg-background p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
              오현
            </div>
            <h3 className="text-base font-bold text-foreground">오현석</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">RestaurantBook 개발자</p>
            <div className="mt-5 space-y-2 text-left">
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span>010-4903-8056</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <a href="mailto:terecal@daum.net" className="hover:text-foreground transition-colors">
                  terecal@daum.net
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-4 py-14 text-center">
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
