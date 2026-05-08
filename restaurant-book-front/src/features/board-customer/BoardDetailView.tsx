"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, X } from "lucide-react";
import { boardApi } from "@/entities/board/api/boardApi";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { RichTextEditor } from "@/shared/ui/lexical/RichTextEditor";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function BoardDetailView({ code, id }: { code: string; id: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: post, isLoading } = useQuery({
    queryKey: ["board", code, id],
    queryFn: () => boardApi.detail(code, id),
  });
  const { data: comments = [] } = useQuery({
    queryKey: ["board-comments", code, id],
    queryFn: () => boardApi.comments(code, id),
  });

  useEffect(() => {
    if (!post) return;
    setTitle(post.title);
    setContent(post.content);
  }, [post]);

  const updateMutation = useMutation({
    mutationFn: () => boardApi.update(code, id, { title, content }),
    onSuccess: (next) => {
      queryClient.setQueryData(["board", code, id], next);
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => boardApi.delete(code, id),
    onSuccess: () => router.replace(`/boards/${code}`),
  });

  return (
    <RequireAuth>
      <main className="w-full px-4 py-4">
        <div className="mb-4">
          <Link href={`/boards/${code}`} className="text-sm text-muted-foreground hover:text-primary">
            목록으로
          </Link>
        </div>

        {isLoading || !post ? (
          <p className="text-sm text-muted-foreground">게시글을 불러오는 중입니다.</p>
        ) : (
          <article className="max-w-4xl">
            <header className="border-b border-border pb-4">
              {editing ? (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xl font-bold outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight">{post.title}</h1>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>{post.authorName}</span>
                <span>{formatDateTime(post.createdAt)}</span>
                <span>조회 {post.viewCount}</span>
                {post.boardCode === "inquiry" && (
                  <span>{post.answered ? "답변완료" : "미답변"}</span>
                )}
              </div>
            </header>

            <section className="min-h-[220px] border-b border-border py-6">
              {editing ? (
                <RichTextEditor
                  key={`edit-${post.id}`}
                  value={content}
                  onChange={setContent}
                  minHeight="360px"
                />
              ) : (
                <RichTextEditor
                  key={`view-${post.id}-${post.updatedAt}`}
                  value={post.content}
                  readOnly
                  minHeight="180px"
                />
              )}
            </section>

            {post.canEdit && (
              <div className="mt-4 flex justify-end gap-2">
                {editing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setTitle(post.title);
                        setContent(post.content);
                      }}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-input px-3 text-sm hover:bg-accent"
                    >
                      <X className="h-4 w-4" />
                      취소
                    </button>
                    <button
                      type="button"
                      disabled={updateMutation.isPending}
                      onClick={() => updateMutation.mutate()}
                      className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
                    >
                      저장
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="h-9 rounded-md border border-input px-3 text-sm hover:bg-accent"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteOpen(true)}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-destructive/50 px-3 text-sm text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      삭제
                    </button>
                  </>
                )}
              </div>
            )}

            {comments.length > 0 && (
              <section className="mt-8 space-y-3">
                <h2 className="text-base font-semibold">답변</h2>
                {comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border border-border bg-muted/20 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium">{comment.authorName}</span>
                      <span className="text-muted-foreground">{formatDateTime(comment.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-7">{comment.content}</p>
                  </div>
                ))}
              </section>
            )}
          </article>
        )}

        <ConfirmDialog
          open={deleteOpen}
          title="게시글을 삭제할까요?"
          description="삭제한 게시글은 목록에서 보이지 않습니다."
          confirmText="삭제"
          variant="destructive"
          loading={deleteMutation.isPending}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => deleteMutation.mutate()}
        />
      </main>
    </RequireAuth>
  );
}
