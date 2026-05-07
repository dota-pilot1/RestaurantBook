"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  fallbackHref?: string;
  label?: string;
};

export function BackButton({ fallbackHref = "/dashboard", label = "이전 화면으로 돌아가기" }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
      className="mb-3 inline-flex h-8 items-center gap-1.5 rounded-md border border-input px-2.5 text-sm font-medium transition-colors hover:bg-accent"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
