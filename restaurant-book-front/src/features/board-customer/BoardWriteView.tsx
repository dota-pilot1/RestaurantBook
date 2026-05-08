"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { boardApi } from "@/entities/board/api/boardApi";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { RichTextEditor } from "@/shared/ui/lexical/RichTextEditor";

export function BoardWriteView({ code }: { code: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const createMutation = useMutation({
    mutationFn: () => boardApi.create(code, { title, content }),
    onSuccess: (post) => router.replace(`/boards/detail?code=${code}&id=${post.id}`),
  });

  return (
    <RequireAuth>
      <main className="w-full px-4 py-4">
        <header className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight">게시글 작성</h1>
        </header>
        <form
          className="max-w-3xl space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={500}
            placeholder="제목"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <RichTextEditor value={content} onChange={setContent} minHeight="360px" />
          {createMutation.isError && (
            <p className="text-sm text-destructive">게시글을 저장하지 못했습니다.</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="h-9 rounded-md border border-input px-3 text-sm hover:bg-accent"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !title.trim() || !content.trim()}
              className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              저장
            </button>
          </div>
        </form>
      </main>
    </RequireAuth>
  );
}
