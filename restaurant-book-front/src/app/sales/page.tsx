"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  BarChart3,
  CalendarDays,
  CreditCard,
  ReceiptText,
  RotateCcw,
} from "lucide-react";
import { paymentApi } from "@/entities/payment/api/paymentApi";
import type { PaymentMethod } from "@/entities/payment/model/types";
import { BackButton } from "@/shared/ui/BackButton";
import { RequireRole } from "@/widgets/guards/RequireRole";

type Preset = "TODAY" | "WEEK" | "MONTH" | "CUSTOM";

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

const formatPrice = (value: number) => `${value.toLocaleString("ko-KR")}원`;
const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const toDateInput = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const getPresetRange = (preset: Preset) => {
  const today = new Date();
  const endDate = toDateInput(today);
  if (preset === "WEEK") {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return { startDate: toDateInput(start), endDate };
  }
  if (preset === "MONTH") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: toDateInput(start), endDate };
  }
  return { startDate: endDate, endDate };
};

export default function SalesPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
      <SalesContent />
    </RequireRole>
  );
}

function SalesContent() {
  const initialRange = useMemo(() => getPresetRange("TODAY"), []);
  const [preset, setPreset] = useState<Preset>("TODAY");
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["sales", startDate, endDate],
    queryFn: () => paymentApi.getSales({ startDate, endDate }),
    refetchOnWindowFocus: true,
  });

  const applyPreset = (nextPreset: Preset) => {
    setPreset(nextPreset);
    if (nextPreset === "CUSTOM") return;
    const range = getPresetRange(nextPreset);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-4 py-5">
      <div className="mx-auto max-w-7xl space-y-5">
        <BackButton fallbackHref="/dashboard" label="대시보드로 돌아가기" />
        <section className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BarChart3 className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">매출 관리</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                현장 결제 기록 기준으로 기간별 매출과 결제수단을 확인합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-bold transition-colors hover:bg-accent"
          >
            <RotateCcw className="h-4 w-4" />
            새로고침
          </button>
        </section>

        <section className="flex flex-col gap-3 rounded-md border border-border bg-background p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {([
              ["TODAY", "오늘"],
              ["WEEK", "최근 7일"],
              ["MONTH", "이번 달"],
              ["CUSTOM", "직접 선택"],
            ] as Array<[Preset, string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => applyPreset(value)}
                className={`h-9 rounded-md border px-3 text-sm font-bold transition-colors ${
                  preset === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-accent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <DateInput label="시작일" value={startDate} onChange={setStartDate} />
            <DateInput label="종료일" value={endDate} onChange={setEndDate} />
          </div>
        </section>

        {isError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            매출 데이터를 불러오지 못했습니다.
          </div>
        ) : null}

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Metric title="총 매출" value={isLoading ? "-" : formatPrice(data?.totalAmount ?? 0)} icon={CreditCard} />
          <Metric title="결제 건수" value={isLoading ? "-" : `${data?.paymentCount ?? 0}건`} icon={ReceiptText} />
          <Metric title="취소 금액" value="0원" icon={RotateCcw} />
          <Metric title="환불 금액" value="0원" icon={CalendarDays} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-md border border-border bg-background">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-bold">결제수단별 매출</h2>
            </div>
            <div className="space-y-3 p-4">
              {(data?.methodSummaries ?? []).map((summary) => {
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
              {!isLoading && (data?.methodSummaries.length ?? 0) === 0 ? (
                <p className="rounded-md border border-dashed border-border p-6 text-center text-sm font-semibold text-muted-foreground">
                  결제 기록이 없습니다.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-md border border-border bg-background">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-bold">최근 결제 목록</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-bold">결제시각</th>
                    <th className="px-4 py-3 font-bold">주문번호</th>
                    <th className="px-4 py-3 font-bold">테이블</th>
                    <th className="px-4 py-3 font-bold">결제수단</th>
                    <th className="px-4 py-3 text-right font-bold">금액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(data?.recentPayments ?? []).map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-4 py-3 font-medium">{formatDateTime(payment.paidAt)}</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold">
                        #{payment.orderNo.split("-").at(-1) ?? payment.orderNo}
                      </td>
                      <td className="px-4 py-3">{payment.tableName ?? "테이블 미지정"}</td>
                      <td className="px-4 py-3">{methodLabel[payment.method]}</td>
                      <td className="px-4 py-3 text-right font-black tabular-nums">
                        {formatPrice(payment.amount)}
                      </td>
                    </tr>
                  ))}
                  {!isLoading && (data?.recentPayments.length ?? 0) === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center font-semibold text-muted-foreground">
                        조회 기간의 결제 기록이 없습니다.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-bold">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function Metric({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <strong className="mt-3 block text-2xl font-bold tracking-tight">{value}</strong>
    </div>
  );
}
