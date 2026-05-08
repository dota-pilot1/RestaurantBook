"use client";

import Link from "next/link";
import { MessageSquare, Megaphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { boardApi } from "@/entities/board/api/boardApi";
import { RequireAuth } from "@/widgets/guards/RequireAuth";

export function BoardHome() {
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["board-configs"],
    queryFn: boardApi.configs,
  });

  return (
    <RequireAuth>
      <main className="w-full px-4 py-4">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">게시판</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            공지사항을 확인하고 문의를 남길 수 있습니다.
          </p>
        </header>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">게시판을 불러오는 중입니다.</p>
        ) : (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {configs.map((config) => {
              const Icon = config.kind === "NOTICE" ? Megaphone : MessageSquare;
              return (
                <Link
                  key={config.code}
                  href={`/boards/${config.code}`}
                  className="rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary hover:bg-accent"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-base font-semibold text-foreground">
                        {config.displayName}
                      </span>
                      {config.description && (
                        <span className="mt-1 line-clamp-2 block text-sm leading-6 text-muted-foreground">
                          {config.description}
                        </span>
                      )}
                    </span>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </main>
    </RequireAuth>
  );
}
