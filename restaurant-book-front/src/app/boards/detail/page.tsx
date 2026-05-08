"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BoardDetailView } from "@/features/board-customer/BoardDetailView";
import { RequireAuth } from "@/widgets/guards/RequireAuth";

export default function BoardDetailQueryPage() {
  return (
    <Suspense fallback={null}>
      <BoardDetailQueryContent />
    </Suspense>
  );
}

function BoardDetailQueryContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const id = Number(searchParams.get("id"));

  if (!code || !Number.isFinite(id) || id <= 0) {
    return (
      <RequireAuth>
        <main className="w-full px-4 py-4">
          <p className="text-sm text-muted-foreground">게시글 정보를 확인할 수 없습니다.</p>
        </main>
      </RequireAuth>
    );
  }

  return <BoardDetailView code={code} id={id} />;
}
