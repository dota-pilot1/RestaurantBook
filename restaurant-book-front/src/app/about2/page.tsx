"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Tablet,
  ChefHat,
  Monitor,
  Smartphone,
  CreditCard,
  ArrowRight,
  LogIn,
  CheckCircle2,
} from "lucide-react";

const devices = [
  {
    icon: Tablet,
    label: "테이블 키오스크",
    who: "고객",
    color: "from-emerald-500 to-teal-600",
    border: "border-emerald-200 dark:border-emerald-800",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    points: [
      "자리마다 고정 배치된 태블릿 키오스크",
      "메뉴 탐색 · 수량 선택 · 주문 완료",
      "직원 호출 · 주문 취소 가능",
      "매장/포장 선택 및 세트메뉴 주문 지원",
    ],
  },
  {
    icon: ChefHat,
    label: "주방 모니터",
    who: "주방",
    color: "from-amber-500 to-orange-600",
    border: "border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    points: [
      "주문 즉시 주방 화면에 자동 표시",
      "조리 시작 · 준비 완료 상태 처리",
      "조리 불필요 메뉴 자동 완료 처리",
      "주문별 구성 항목 및 수량 한눈에 확인",
    ],
  },
  {
    icon: Monitor,
    label: "대형 대기 모니터",
    who: "홀 · 대기 공간",
    color: "from-violet-500 to-purple-600",
    border: "border-violet-200 dark:border-violet-800",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
    points: [
      "주문 대기 · 조리 중 · 준비 완료 상태 실시간 표시",
      "고객이 직접 자신의 주문 상태를 확인",
      "홀 대형 TV 또는 카운터 모니터에 연결",
      "테이블 번호 기반 상태 분류 표시",
    ],
  },
  {
    icon: Smartphone,
    label: "직원 스마트폰 / 태블릿",
    who: "서빙 직원",
    color: "from-sky-500 to-blue-600",
    border: "border-sky-200 dark:border-sky-800",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
    points: [
      "준비 완료된 메뉴 확인 및 서빙 처리",
      "고객 호출 알림 실시간 수신",
      "현장에서 이동 중에도 업무 대응 가능",
      "주문 현황 전체 조회 및 빠른 응답",
    ],
  },
  {
    icon: CreditCard,
    label: "데스크 결제 관리",
    who: "카운터 직원 · 관리자",
    color: "from-rose-500 to-pink-600",
    border: "border-rose-200 dark:border-rose-800",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
    points: [
      "카드 · 현금 후불 결제 처리 및 환불",
      "테이블별 주문 내역 및 금액 확인",
      "매출 통계 · 주문 현황 대시보드",
      "메뉴 · 테이블 · 직원 권한 통합 관리",
    ],
  },
];

const flow = [
  { step: "01", text: "고객이 테이블 키오스크로 주문" },
  { step: "02", text: "주방 모니터에 즉시 표시 → 조리 시작" },
  { step: "03", text: "대기 모니터에 진행 상태 실시간 반영" },
  { step: "04", text: "직원 태블릿에 준비 완료 알림" },
  { step: "05", text: "서빙 완료 → 데스크에서 후불 결제" },
];

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function SlideIn({ children, delay = 0, direction = "left" }: { children: React.ReactNode; delay?: number; direction?: "left" | "right" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: direction === "left" ? -50 : 50 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function About2Page() {
  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/40 to-background px-4 py-20 text-center sm:py-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mx-auto max-w-2xl"
        >
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Monitor className="h-3.5 w-3.5" />
            RestaurantBook 핵심 이용 방법
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            하나의 시스템으로<br />
            <span className="text-primary">전체 매장을 연결</span>합니다
          </h1>
          <p className="mt-5 text-base text-muted-foreground sm:text-lg">
            키오스크부터 주방, 대기 모니터, 직원 태블릿, 데스크 결제까지<br className="hidden sm:block" />
            각 역할에 맞는 화면으로 매장 운영 전 과정을 커버합니다.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <LogIn className="h-4 w-4" />
              로그인하기
            </Link>
            <Link
              href="/about"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-5 text-sm font-medium transition-colors hover:bg-accent"
            >
              서비스 소개 보기
            </Link>
          </div>
        </motion.div>

        {/* 배경 장식 */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>
      </section>

      {/* 주문 흐름 타임라인 */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <FadeUp>
          <h2 className="mb-10 text-center text-xl font-bold tracking-tight">주문 한 건이 흐르는 과정</h2>
        </FadeUp>
        <div className="relative">
          <div className="absolute left-6 top-0 h-full w-px bg-border sm:left-8" />
          <ol className="space-y-6">
            {flow.map((item, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <li className="flex items-center gap-5 pl-14 sm:pl-20">
                  <span className="absolute left-0 flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-bold text-primary sm:h-16 sm:w-16 sm:text-base">
                    {item.step}
                  </span>
                  <div className="rounded-xl border border-border bg-background px-5 py-4 text-sm font-medium shadow-sm w-full">
                    {item.text}
                  </div>
                </li>
              </FadeUp>
            ))}
          </ol>
        </div>
      </section>

      {/* 디바이스별 상세 설명 */}
      <section className="border-t border-border bg-muted/10 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <FadeUp>
            <h2 className="mb-12 text-center text-xl font-bold tracking-tight">디바이스별 역할 상세</h2>
          </FadeUp>
          <div className="space-y-8">
            {devices.map((device, i) => {
              const Icon = device.icon;
              const direction = i % 2 === 0 ? "left" : "right";
              return (
                <SlideIn key={device.label} delay={0.1} direction={direction}>
                  <div className={`flex flex-col gap-5 rounded-2xl border ${device.border} ${device.bg} p-6 sm:flex-row sm:items-start`}>
                    <div className="flex shrink-0 flex-col items-center gap-2 sm:items-start">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${device.color} text-white shadow-md`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${device.badge}`}>
                        {device.who}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-foreground">{device.label}</h3>
                      <ul className="mt-3 space-y-2">
                        {device.points.map((pt) => (
                          <li key={pt} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground/40" />
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </SlideIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* 한눈에 보는 구성 */}
      <section className="border-t border-border px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <FadeUp>
            <h2 className="mb-10 text-center text-xl font-bold tracking-tight">한눈에 보는 시스템 구성</h2>
          </FadeUp>
          <div className="grid gap-4 sm:grid-cols-5">
            {devices.map((device, i) => {
              const Icon = device.icon;
              return (
                <FadeUp key={device.label} delay={i * 0.08}>
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-4 text-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${device.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold leading-snug text-foreground">{device.label}</p>
                    <p className="text-[11px] text-muted-foreground">{device.who}</p>
                  </div>
                </FadeUp>
              );
            })}
          </div>
          <FadeUp delay={0.4}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              {devices.map((d, i) => (
                <span key={d.label} className="flex items-center gap-1">
                  {i > 0 && <ArrowRight className="h-3.5 w-3.5 text-border" />}
                  <span className="font-medium text-foreground">{d.label}</span>
                </span>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-muted/20 px-4 py-16 text-center">
        <FadeUp>
          <div className="mx-auto max-w-md">
            <h2 className="text-xl font-bold">직접 경험해보세요</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              테스트 계정으로 각 역할별 화면을 바로 체험할 수 있습니다.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              로그인하기 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </FadeUp>
      </section>
    </div>
  );
}
