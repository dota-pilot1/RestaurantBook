"use client";

import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { customerPaymentApi } from "@/entities/payment/api/customerPaymentApi";
import type { ConfirmTossPaymentResponse } from "@/entities/payment/model/customerPaymentTypes";
import { getErrorMessage } from "@/shared/api/errors";

const TOSS_PAYMENT_META_KEY_PREFIX = "restaurantBook:tossPayment:";

type StoredPaymentMeta = {
  tableName?: string;
  restaurantOrderIds?: number[];
  amount?: number;
};

type ConfirmState =
  | { status: "confirming" }
  | { status: "success"; result: ConfirmTossPaymentResponse }
  | { status: "error"; message: string };

function parseOrderIds(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);
}

function readStoredMeta(tossOrderId: string): StoredPaymentMeta | null {
  try {
    const raw = window.localStorage.getItem(`${TOSS_PAYMENT_META_KEY_PREFIX}${tossOrderId}`);
    return raw ? (JSON.parse(raw) as StoredPaymentMeta) : null;
  } catch {
    return null;
  }
}

function PaymentSuccessContent() {
  const queryClient = useQueryClient();
  const confirmedRef = useRef(false);
  const [state, setState] = useState<ConfirmState>({ status: "confirming" });

  useEffect(() => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const paymentKey = params.get("paymentKey");
    const tossOrderId = params.get("orderId");
    const amountParam = params.get("amount");

    if (!paymentKey || !tossOrderId || !amountParam) {
      setState({ status: "error", message: "토스 결제 결과 정보가 올바르지 않습니다." });
      return;
    }

    const storedMeta = readStoredMeta(tossOrderId);
    const tableName = params.get("tableName") || storedMeta?.tableName || "";
    const restaurantOrderIds =
      parseOrderIds(params.get("restaurantOrderIds")).length > 0
        ? parseOrderIds(params.get("restaurantOrderIds"))
        : storedMeta?.restaurantOrderIds ?? [];
    const amount = Number(amountParam || storedMeta?.amount);

    if (!tableName.trim() || restaurantOrderIds.length === 0 || !Number.isInteger(amount) || amount <= 0) {
      setState({ status: "error", message: "결제 승인에 필요한 주문 정보가 없습니다." });
      return;
    }

    customerPaymentApi.confirmTossPayment({
      tossOrderId,
      paymentKey,
      amount,
      tableName,
      restaurantOrderIds,
    }).then((result) => {
      window.localStorage.removeItem(`${TOSS_PAYMENT_META_KEY_PREFIX}${tossOrderId}`);
      queryClient.invalidateQueries({ queryKey: ["customer-active-orders", tableName] });
      setState({ status: "success", result });
    }).catch((e) => {
      setState({ status: "error", message: getErrorMessage(e, "결제 승인에 실패했습니다.") });
    });
  }, [queryClient]);

  if (state.status === "confirming") {
    return (
      <PaymentResultShell
        icon={<Loader2 className="h-9 w-9 animate-spin text-primary" />}
        title="결제 승인 중"
        description="토스 결제 결과를 서버에서 확인하고 있습니다."
      />
    );
  }

  if (state.status === "error") {
    return (
      <PaymentResultShell
        icon={<XCircle className="h-9 w-9 text-red-600" />}
        title="결제 승인 실패"
        description={state.message}
        tone="error"
      />
    );
  }

  return (
    <PaymentResultShell
      icon={<CheckCircle2 className="h-9 w-9 text-emerald-600" />}
      title="결제가 완료되었습니다"
      description={`${state.result.orders.length}건 · ${state.result.amount.toLocaleString("ko-KR")}원`}
      tone="success"
    />
  );
}

function PaymentResultShell({
  icon,
  title,
  description,
  tone = "info",
}: {
  icon: ReactNode;
  title: string;
  description: string;
  tone?: "success" | "error" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "error"
        ? "border-red-200 bg-red-50"
        : "border-border bg-background";

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-zinc-50 p-4">
      <section className={`w-full max-w-md rounded-lg border p-6 text-center shadow-sm ${toneClass}`}>
        <div className="flex justify-center">{icon}</div>
        <h1 className="mt-4 text-xl font-black">{title}</h1>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">{description}</p>
        <Link
          href="/customer"
          className="mt-6 flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          키오스크로 돌아가기
        </Link>
      </section>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
