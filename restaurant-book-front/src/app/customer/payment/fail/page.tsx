"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";

function PaymentFailContent() {
  const params = useSearchParams();
  const code = params.get("code") || "PAYMENT_FAILED";
  const message = params.get("message") || "결제가 완료되지 않았습니다.";
  const orderId = params.get("orderId");

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-zinc-50 p-4">
      <section className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center shadow-sm">
        <div className="flex justify-center">
          <XCircle className="h-9 w-9 text-red-600" />
        </div>
        <h1 className="mt-4 text-xl font-black">결제가 취소되었습니다</h1>
        <p className="mt-2 text-sm font-semibold text-red-800">{message}</p>
        <div className="mt-4 rounded-md border border-red-200 bg-white/70 p-3 text-left text-xs font-semibold text-muted-foreground">
          <p>코드: {code}</p>
          {orderId ? <p className="mt-1">결제 요청: {orderId}</p> : null}
        </div>
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

export default function PaymentFailPage() {
  return (
    <Suspense fallback={null}>
      <PaymentFailContent />
    </Suspense>
  );
}
