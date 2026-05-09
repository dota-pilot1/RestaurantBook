"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Tablet,
  Monitor,
  ChefHat,
  Smartphone,
  CreditCard,
  ShoppingCart,
  Laptop,
  ArrowRight,
  LogIn,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Utensils,
  Bell,
  ClipboardCheck,
  Package,
  Banknote,
  ReceiptText,
} from "lucide-react";

/* ─── 기기 목록 ─── */
const devices = [
  {
    icon: Tablet,
    name: "고객 키오스크",
    desc: "테이블마다 고정 배치된 태블릿",
    who: "고객",
    usage: "메뉴 탐색 · 주문 · 직원 호출 · 주문 취소",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    dot: "bg-emerald-500",
  },
  {
    icon: Monitor,
    name: "고객 주문 확인판",
    desc: "홀 대형 TV / 60인치 디스플레이",
    who: "고객 전체",
    usage: "주문 대기 · 조리 중 · 준비 완료 상태 실시간 확인",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    dot: "bg-violet-500",
  },
  {
    icon: ChefHat,
    name: "주방 알림판",
    desc: "주방 내 전용 모니터",
    who: "주방 직원",
    usage: "주문 즉시 수신 · 조리 시작/완료 처리 · 메뉴별 상태 관리",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    dot: "bg-amber-500",
  },
  {
    icon: Smartphone,
    name: "직원용 기기",
    desc: "스마트폰 또는 태블릿",
    who: "서빙 직원",
    usage: "준비 완료 알림 수신 · 서빙 처리 · 고객 호출 응답",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    dot: "bg-sky-500",
  },
  {
    icon: CreditCard,
    name: "데스크용 기기",
    desc: "카운터 고정 PC / 태블릿",
    who: "카운터 직원",
    usage: "후불 결제(카드·현금) · 환불 · 주문 내역 조회",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    dot: "bg-rose-500",
  },
  {
    icon: ShoppingCart,
    name: "쇼핑몰 키오스크",
    desc: "매장 입구 / 대형 스탠드형 키오스크",
    who: "방문 고객",
    usage: "온라인 상품 탐색 · 현장 구매 · (쇼핑몰 연동 예정)",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    dot: "bg-indigo-500",
  },
  {
    icon: Laptop,
    name: "관리자 노트북",
    desc: "백오피스 전용",
    who: "관리자",
    usage: "대시보드 · 메뉴/테이블/직원 관리 · 매출 통계 · 시스템 설정",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-950/40",
    dot: "bg-slate-500",
  },
];

/* ─── 전체 시나리오 단계 ─── */
const scenarioSteps = [
  {
    phase: "도입",
    color: "border-emerald-500 bg-emerald-500",
    steps: [
      { icon: Tablet, text: "테이블마다 태블릿 키오스크 설치 및 앱 실행" },
      { icon: Monitor, text: "홀 대형 TV에 고객 주문 확인판 연결" },
      { icon: ChefHat, text: "주방에 알림판 모니터 설치" },
      { icon: Laptop, text: "관리자 노트북으로 메뉴·테이블 초기 설정" },
    ],
  },
  {
    phase: "운영",
    color: "border-amber-500 bg-amber-500",
    steps: [
      { icon: Tablet, text: "고객 착석 → 키오스크로 메뉴 선택 및 주문" },
      { icon: ChefHat, text: "주방 알림판에 즉시 표시 → 조리 시작" },
      { icon: Monitor, text: "대형 확인판에 조리 진행 상태 실시간 반영" },
      { icon: Smartphone, text: "준비 완료 시 직원 기기로 알림 → 서빙" },
      { icon: CreditCard, text: "식사 후 데스크에서 후불 결제 처리" },
    ],
  },
  {
    phase: "확장 (예정)",
    color: "border-indigo-500 bg-indigo-500",
    steps: [
      { icon: ShoppingCart, text: "매장 입구 쇼핑몰 키오스크 연동" },
      { icon: Tablet, text: "QR코드 기반 개인 스마트폰 주문 지원" },
      { icon: CreditCard, text: "카카오페이 · 토스페이 간편결제 연동" },
      { icon: Laptop, text: "매출 통계 고도화 · 재방문 분석 리포트" },
    ],
  },
];

/* ─── 주방 사용법 ─── */
const kitchenSteps = [
  {
    icon: Bell,
    title: "주문 자동 수신",
    desc: "고객이 키오스크에서 주문을 완료하면 주방 알림판에 즉시 표시됩니다. 별도 확인 없이 자동으로 접수됩니다.",
    tag: "자동",
    tagColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  {
    icon: ChefHat,
    title: "조리 시작 처리",
    desc: "주방 직원이 해당 주문의 '조리 시작' 버튼을 누르면 상태가 변경되고, 고객 대기 확인판에도 반영됩니다.",
    tag: "수동",
    tagColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    icon: Package,
    title: "조리 불필요 메뉴 자동 완료",
    desc: "음료·완성품처럼 조리가 필요 없는 메뉴는 주문 즉시 '준비 완료' 처리됩니다. 주방 부담을 줄여줍니다.",
    tag: "자동",
    tagColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  {
    icon: ClipboardCheck,
    title: "준비 완료 처리",
    desc: "조리가 끝난 항목을 '완료' 처리하면 직원 기기로 서빙 알림이 전송되고 대기 모니터 상태가 갱신됩니다.",
    tag: "수동",
    tagColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
];

/* ─── 직원 사용법 ─── */
const staffSteps = [
  {
    icon: Bell,
    title: "준비 완료 알림 수신",
    desc: "주방에서 '준비 완료' 처리 시 직원 기기에 알림이 옵니다. 어느 테이블의 어떤 메뉴인지 즉시 확인 가능합니다.",
  },
  {
    icon: Utensils,
    title: "서빙 완료 처리",
    desc: "음식을 전달한 뒤 서빙 완료 버튼을 누릅니다. 주문 상태가 갱신되어 중복 서빙을 방지합니다.",
  },
  {
    icon: Smartphone,
    title: "고객 호출 응답",
    desc: "고객이 키오스크에서 직원을 호출하면 알림이 울립니다. 이동 중에도 확인하고 즉시 응대할 수 있습니다.",
  },
  {
    icon: ReceiptText,
    title: "주문 내역 확인",
    desc: "테이블별 전체 주문 내역을 조회하고 필요 시 주문을 취소하거나 수정을 도울 수 있습니다.",
  },
  {
    icon: Banknote,
    title: "데스크 결제 처리",
    desc: "식사가 끝난 고객을 카운터로 안내하면 데스크 직원이 카드·현금 후불 결제를 처리합니다. 환불도 가능합니다.",
  },
];

/* ─── 공통 애니메이션 컴포넌트 ─── */
function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 36 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.55, delay, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}

function SlideIn({ children, delay = 0, from = "left" }: { children: React.ReactNode; delay?: number; from?: "left" | "right" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, x: from === "left" ? -48 : 48 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.55, delay, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}

/* ─── 시나리오 아코디언 ─── */
function ScenarioAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {scenarioSteps.map((phase, pi) => (
        <FadeUp key={pi} delay={pi * 0.1}>
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <button
              onClick={() => setOpen(open === pi ? null : pi)}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${phase.color.split(" ")[1]}`} />
                <span className="font-semibold text-foreground">{phase.phase}</span>
                <span className="text-xs text-muted-foreground">{phase.steps.length}단계</span>
              </div>
              <motion.div animate={{ rotate: open === pi ? 180 : 0 }} transition={{ duration: 0.25 }}>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {open === pi && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="border-t border-border px-5 pb-5 pt-4">
                    <ol className="space-y-3">
                      {phase.steps.map((step, si) => {
                        const Icon = step.icon;
                        return (
                          <li key={si} className="flex items-start gap-3">
                            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${phase.color.split(" ")[1]} text-white`}>
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <div className="flex items-start gap-2 pt-0.5">
                              <span className="text-xs font-bold text-muted-foreground">{String(si + 1).padStart(2, "0")}</span>
                              <span className="text-sm text-foreground">{step.text}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FadeUp>
      ))}
    </div>
  );
}

/* ─── 메인 페이지 ─── */
export default function About2Page() {
  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/50 to-background px-4 py-20 text-center sm:py-28">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mx-auto max-w-2xl">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Utensils className="h-3.5 w-3.5" />
            RestaurantBook 사용 가이드
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            어떤 기기에서든<br />
            <span className="text-primary">하나로 연결되는 매장</span>
          </h1>
          <p className="mt-4 text-sm text-foreground/70 sm:text-base">
            키오스크·주방·대기판·직원 기기·데스크까지<br className="hidden sm:block" />
            각 역할에 맞는 화면으로 전 과정을 연결합니다.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              <LogIn className="h-4 w-4" /> 로그인하기
            </Link>
            <Link href="/about" className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-5 text-sm font-medium hover:bg-accent transition-colors">
              서비스 소개 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/6 blur-3xl" />
        </div>
      </section>

      {/* 기기 테이블 */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <FadeUp>
          <h2 className="mb-2 text-center text-xl font-bold tracking-tight">구성 기기 한눈에 보기</h2>
          <p className="mb-10 text-center text-sm text-foreground/65">매장에 도입되는 기기와 각 담당 역할입니다.</p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/60">기기</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/60 hidden sm:table-cell">형태</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/60">담당</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/60 hidden md:table-cell">주요 기능</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d, i) => {
                  const Icon = d.icon;
                  return (
                    <motion.tr
                      key={d.name}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-30px" }}
                      transition={{ duration: 0.4, delay: i * 0.07 }}
                      className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${d.bg}`}>
                            <Icon className={`h-4 w-4 ${d.color}`} />
                          </span>
                          <span className="font-medium text-foreground">{d.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-foreground/80 hidden sm:table-cell">{d.desc}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${d.bg} ${d.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${d.dot}`} />
                          {d.who}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-foreground/75 hidden md:table-cell leading-relaxed">{d.usage}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </FadeUp>
      </section>

      {/* 전체 시나리오 */}
      <section className="border-t border-border bg-muted/10 px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <FadeUp>
            <h2 className="mb-2 text-center text-xl font-bold tracking-tight">전체 사용 시나리오</h2>
            <p className="mb-10 text-center text-sm text-foreground/65">도입부터 일상 운영, 그리고 향후 확장까지의 흐름입니다.</p>
          </FadeUp>
          <ScenarioAccordion />
        </div>
      </section>

      {/* 주방 사용법 */}
      <section className="border-t border-border px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <FadeUp>
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
                <ChefHat className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">주방 핵심 사용법</h2>
                <p className="text-sm text-muted-foreground">주문 접수부터 조리 완료까지</p>
              </div>
            </div>
          </FadeUp>
          <div className="relative pl-8">
            <div className="absolute left-3.5 top-0 h-full w-px bg-border" />
            <div className="space-y-6">
              {kitchenSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <SlideIn key={i} delay={i * 0.1} from="left">
                    <div className="relative flex gap-4">
                      <span className="absolute -left-8 flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-500 bg-background text-xs font-bold text-amber-600">
                        {i + 1}
                      </span>
                      <div className="flex-1 rounded-xl border border-border bg-background p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                            <div>
                              <p className="font-semibold text-foreground">{step.title}</p>
                              <p className="mt-1 text-sm text-foreground/70 leading-relaxed">{step.desc}</p>
                            </div>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${step.tagColor}`}>{step.tag}</span>
                        </div>
                      </div>
                    </div>
                  </SlideIn>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 직원 사용법 */}
      <section className="border-t border-border bg-muted/10 px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <FadeUp>
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-white">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">직원 핵심 사용법</h2>
                <p className="text-sm text-muted-foreground">서빙 알림부터 결제 처리까지</p>
              </div>
            </div>
          </FadeUp>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {staffSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <SlideIn key={i} delay={i * 0.08} from={i % 2 === 0 ? "left" : "right"}>
                  <div className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-background p-5 transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/40">
                        <Icon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">STEP {String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <p className="font-semibold text-foreground">{step.title}</p>
                    <p className="text-xs text-foreground/70 leading-relaxed">{step.desc}</p>
                    <div className="mt-auto flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 opacity-0 transition-opacity group-hover:opacity-100">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      완료 처리 가능
                    </div>
                  </div>
                </SlideIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-4 py-16 text-center">
        <FadeUp>
          <div className="mx-auto max-w-md">
            <h2 className="text-xl font-bold">지금 바로 체험해보세요</h2>
            <p className="mt-2 text-sm text-foreground/70">테스트 계정으로 각 역할별 화면을 체험할 수 있습니다.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/login" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                로그인하기 <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/about" className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-6 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
                서비스 소개
              </Link>
            </div>
          </div>
        </FadeUp>
      </section>
    </div>
  );
}
