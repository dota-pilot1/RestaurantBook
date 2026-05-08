"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutList,
  Lock,
  MessageSquare,
  MousePointerClick,
  Pencil,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminBoardApi } from "@/entities/board/api/adminBoardApi";
import { boardApi } from "@/entities/board/api/boardApi";
import type { BoardConfig, BoardSummary } from "@/entities/board/model/types";
import { useAuth } from "@/entities/user/model/authStore";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { RichTextEditor } from "@/shared/ui/lexical/RichTextEditor";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(post: BoardSummary) {
  if (post.pinned) return "고정";
  if (post.boardCode === "inquiry") return post.answered ? "답변완료" : "미답변";
  return "게시";
}

function postCountLabel(count: number) {
  return `${count.toLocaleString("ko-KR")} posts`;
}

export function BoardListView({ code }: { code: string }) {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const { data: configs = [] } = useQuery({
    queryKey: ["board-configs"],
    queryFn: boardApi.configs,
  });
  const { data, isLoading } = useQuery({
    queryKey: ["boards", code, page],
    queryFn: () => boardApi.list(code, page, 20),
  });
  const { data: selectedPost, isLoading: isDetailLoading } = useQuery({
    queryKey: ["board", code, selectedId],
    queryFn: () => boardApi.detail(code, selectedId as number),
    enabled: selectedId !== null,
  });
  const { data: selectedComments = [] } = useQuery({
    queryKey: ["board-comments", code, selectedId],
    queryFn: () => boardApi.comments(code, selectedId as number),
    enabled: selectedId !== null,
  });

  const config: BoardConfig | undefined = configs.find((item) => item.code === code);
  const canWrite = !!config?.allowCustomerWrite;
  const isAdmin = user?.role.code === "ROLE_ADMIN";
  const posts = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const startWriting = () => {
    setSelectedId(null);
    setIsWriting(true);
  };

  return (
    <RequireAuth>
      <main className="mx-auto flex w-full max-w-[1640px] flex-col px-4 py-7 lg:px-8">
        <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <nav className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link href="/" className="transition-colors hover:text-foreground">홈</Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
              <Link href="/boards" className="transition-colors hover:text-foreground">게시판</Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
              <span className="font-medium text-foreground">{config?.displayName ?? "게시판"}</span>
            </nav>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <LayoutList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold leading-tight tracking-tight text-foreground">
                  {config?.displayName ?? "게시판"}
                </h1>
                {config?.description && (
                  <p className="mt-1 text-sm leading-none text-muted-foreground">{config.description}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-4 text-sm font-semibold shadow-sm">
              {postCountLabel(totalElements)}
            </span>
            {canWrite && (
              <button
                type="button"
                onClick={startWriting}
                className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90 ${
                  isWriting
                    ? "bg-primary/10 text-primary ring-2 ring-primary/20"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <Pencil className="h-4 w-4" />
                글쓰기
              </button>
            )}
            {!canWrite && <DisabledWriteButton />}
          </div>
        </header>

        <section className="grid min-h-[560px] gap-4 lg:grid-cols-[minmax(360px,0.72fr)_minmax(0,1.28fr)]">
          <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
            <div className="grid grid-cols-[72px_minmax(0,1fr)_120px] border-b border-border bg-muted/50 px-5 py-3 text-xs font-semibold text-muted-foreground">
              <span>NO.</span>
              <span>제목</span>
              <span className="text-right">날짜</span>
            </div>

            {isLoading ? (
              <div className="space-y-3 p-5">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-3 p-3">
                {posts.map((post, index) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => {
                      setIsWriting(false);
                      setSelectedId(post.id);
                    }}
                    className={`relative grid w-full grid-cols-[56px_minmax(0,1fr)_84px] items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all hover:border-primary/40 hover:bg-accent hover:shadow-sm ${
                      selectedId === post.id
                        ? "border-primary/40 bg-primary/5 ring-2 ring-primary/10"
                        : "border-border bg-background"
                    }`}
                  >
                    {selectedId === post.id && (
                      <span className="absolute left-0 top-4 h-10 w-1 rounded-r-full bg-primary" />
                    )}
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold ${
                        selectedId === post.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {page * 20 + index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className={`truncate text-sm font-semibold ${
                            selectedId === post.id ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {post.title}
                        </span>
                        <span className="shrink-0 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                          {statusLabel(post)}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">
                        {post.authorName} · 조회 {post.viewCount}
                      </span>
                    </span>
                    <span
                      className={`justify-self-end rounded-md px-2.5 py-1.5 text-xs font-semibold ${
                        selectedId === post.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {formatShortDate(post.createdAt)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyPostList canWrite={canWrite} onStartWrite={startWriting} />
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
            {isWriting ? (
              <InlineCreatePanel
                code={code}
                onCancel={() => setIsWriting(false)}
                onCreated={(postId) => {
                  setPage(0);
                  setIsWriting(false);
                  setSelectedId(postId);
                }}
              />
            ) : selectedId === null ? (
              <EmptyDetailPanel />
            ) : isDetailLoading || !selectedPost ? (
              <DetailLoadingPanel />
            ) : (
              <InlineDetailPanel
                code={code}
                isAdmin={isAdmin}
                post={selectedPost}
                comments={selectedComments}
              />
            )}
          </div>
        </section>

        {data && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((v) => Math.max(0, v - 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-muted-foreground">
              {page + 1} / {data.totalPages}
            </span>
            <button
              type="button"
              disabled={page + 1 >= data.totalPages}
              onClick={() => setPage((v) => v + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>
    </RequireAuth>
  );
}

function InlineDetailPanel({
  code,
  isAdmin,
  post,
  comments,
}: {
  code: string;
  isAdmin: boolean;
  post: {
    id: number;
    title: string;
    content: string;
    authorName: string;
    answered: boolean;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
  };
  comments: Array<{
    id: number;
    authorName: string;
    content: string;
    adminReply: boolean;
    createdAt: string;
  }>;
}) {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");
  const [commentFormOpen, setCommentFormOpen] = useState(false);
  const commentMutation = useMutation({
    mutationFn: () =>
      isAdmin
        ? adminBoardApi.createComment(code, post.id, reply)
        : boardApi.createComment(code, post.id, reply),
    onSuccess: () => {
      setReply("");
      setCommentFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["board-comments", code, post.id] });
      queryClient.invalidateQueries({ queryKey: ["board", code, post.id] });
      queryClient.invalidateQueries({ queryKey: ["boards", code] });
      queryClient.invalidateQueries({ queryKey: ["admin-board-unanswered-count"] });
    },
  });
  const canComment = code === "inquiry";

  return (
    <article className="flex min-h-[560px] flex-col bg-background">
      <header className="border-b border-border bg-muted/50 px-6 py-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Post detail
          </span>
          {code === "inquiry" && (
            <span className="rounded-md border border-primary/20 bg-background px-2 py-1 text-xs text-primary">
              {post.answered ? "답변완료" : "미답변"}
            </span>
          )}
        </div>
        <h2 className="text-2xl font-semibold leading-snug tracking-tight text-foreground">
          {post.title}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">{post.authorName}</span>
          <span>{formatDateTime(post.createdAt)}</span>
          <span>조회 {post.viewCount}</span>
          <Link
            href={`/boards/detail?code=${code}&id=${post.id}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            상세 페이지
          </Link>
        </div>
      </header>

      <section className="flex-1 bg-background px-6 py-6">
        <RichTextEditor
          key={`inline-view-${post.id}-${post.updatedAt}`}
          value={post.content}
          readOnly
          minHeight="180px"
        />
      </section>

      <section className="border-t border-border bg-secondary/60">
        <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border bg-muted/50 px-6 py-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold leading-none">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background text-primary">
              <MessageSquare className="h-4 w-4" />
            </span>
            <span className="inline-flex h-8 items-center">댓글/답변 {comments.length}</span>
          </h3>
          {canComment && (
            <button
              type="button"
              onClick={() => setCommentFormOpen((value) => !value)}
              className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium leading-none text-foreground transition-colors hover:bg-accent"
            >
              {commentFormOpen ? "닫기" : isAdmin ? "답변 작성" : "댓글 작성"}
            </button>
          )}
        </div>

        {canComment && (
          <div
            aria-hidden={!commentFormOpen}
            className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
              commentFormOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <form
                className="border-b border-border bg-background px-6 py-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (reply.trim()) {
                    commentMutation.mutate();
                  }
                }}
              >
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  rows={3}
                  disabled={!commentFormOpen}
                  placeholder={isAdmin ? "관리자 답변을 입력하세요." : "댓글을 입력하세요."}
                  className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-default"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={!commentFormOpen || commentMutation.isPending || !reply.trim()}
                    className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
                  >
                    {commentMutation.isPending ? "등록 중..." : isAdmin ? "답변 등록" : "댓글 등록"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {comments.length > 0 ? (
          <div className="space-y-2 px-6 py-4">
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-lg border border-border bg-background p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{comment.authorName}</span>
                  {comment.adminReply && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      관리자
                    </span>
                  )}
                  <span>{formatDate(comment.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6">{comment.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-6 py-5 text-sm text-muted-foreground">등록된 댓글/답변이 없습니다.</p>
        )}
      </section>
    </article>
  );
}

function InlineCreatePanel({
  code,
  onCancel,
  onCreated,
}: {
  code: string;
  onCancel: () => void;
  onCreated: (postId: number) => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const createMutation = useMutation({
    mutationFn: () => boardApi.create(code, { title: title.trim(), content }),
    onSuccess: (post) => {
      queryClient.setQueryData(["board", code, post.id], post);
      queryClient.invalidateQueries({ queryKey: ["boards", code] });
      queryClient.invalidateQueries({ queryKey: ["board", code, post.id] });
      onCreated(post.id);
    },
  });

  return (
    <article className="flex min-h-[560px] flex-col bg-background">
      <header className="border-b border-border bg-muted/50 px-6 py-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            New post
          </span>
          <span className="rounded-md border border-primary/20 bg-background px-2 py-1 text-xs text-primary">
            작성 중
          </span>
        </div>
        <h2 className="text-2xl font-semibold leading-snug tracking-tight text-foreground">
          게시글 작성
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          왼쪽 목록은 유지되고, 저장하면 새 게시글 상세가 바로 열립니다.
        </p>
      </header>

      <form
        className="flex flex-1 flex-col bg-background"
        onSubmit={(event) => {
          event.preventDefault();
          if (title.trim() && content.trim()) {
            createMutation.mutate();
          }
        }}
      >
        <section className="flex-1 space-y-4 px-6 py-6">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={500}
            placeholder="제목"
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <RichTextEditor value={content} onChange={setContent} minHeight="320px" />
          {createMutation.isError && (
            <p className="text-sm text-destructive">게시글을 저장하지 못했습니다.</p>
          )}
        </section>

        <footer className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={createMutation.isPending}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || !title.trim() || !content.trim()}
            className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {createMutation.isPending ? "저장 중..." : "저장"}
          </button>
        </footer>
      </form>
    </article>
  );
}

function DetailLoadingPanel() {
  return (
    <div className="min-h-[560px] space-y-4 p-6">
      <div className="h-7 w-2/3 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-1/3 animate-pulse rounded-md bg-muted" />
      <div className="h-64 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

function EmptyPostList({ canWrite, onStartWrite }: { canWrite: boolean; onStartWrite: () => void }) {
  return (
    <div className="flex min-h-[500px] flex-col bg-muted/20 p-5">
      <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
          <span className="text-xs font-semibold text-muted-foreground">최근 게시글</span>
          <span className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">0</span>
        </div>
        <div className="space-y-2">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                item === 0 ? "border-primary/30 bg-primary/10" : "border-border bg-background"
              }`}
            >
              <span className={`h-7 w-7 rounded-md ${item === 0 ? "bg-primary/20" : "bg-muted"}`} />
              <span className="min-w-0 flex-1 space-y-2">
                <span className={`block h-2.5 rounded-full ${item === 0 ? "w-3/5 bg-primary/25" : "w-1/2 bg-muted"}`} />
                <span className={`block h-2 w-1/3 rounded-full ${item === 0 ? "bg-primary/15" : "bg-muted"}`} />
              </span>
              <span className="h-6 w-14 rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center py-8 text-center">
        {canWrite ? (
          <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Pencil className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">첫 게시글을 작성해보세요</p>
            <p className="mt-1 text-xs text-muted-foreground">문의나 안내를 게시판에 남길 수 있습니다.</p>
            <button
              type="button"
              onClick={onStartWrite}
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              <Pencil className="h-4 w-4" />
              첫 글 작성
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-background p-5 shadow-sm">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">아직 게시글이 없습니다</p>
            <p className="mb-4 mt-1 text-xs text-muted-foreground">공지사항은 관리자만 등록할 수 있습니다.</p>
            <DisabledWriteButton />
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyDetailPanel() {
  return (
    <div className="relative flex min-h-[560px] flex-col items-center justify-center overflow-hidden bg-muted/10 px-8 py-10 text-center">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative flex w-full max-w-[620px] flex-col items-center">
        <div className="relative h-64 w-full">
          <div className="board-empty-float-a absolute left-[4%] top-12 w-[38%] rounded-xl border border-border bg-background/95 p-3 shadow-sm">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className={`mb-2 flex items-center gap-2 rounded-lg border px-3 py-2 last:mb-0 ${
                  item === 1 ? "border-primary/40 bg-primary/10 shadow-sm" : "border-border bg-background"
                }`}
              >
                <span className={`h-6 w-6 rounded-md ${item === 1 ? "bg-primary/20" : "bg-muted"}`} />
                <span className={`h-2.5 rounded-full ${item === 1 ? "w-24 bg-primary/25" : "w-20 bg-muted"}`} />
              </div>
            ))}
          </div>

          <div className="board-empty-arrow absolute left-[43%] top-[104px] flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-primary shadow-sm">
            <ArrowRight className="h-5 w-5" />
          </div>

          <div className="board-empty-float-b absolute right-[4%] top-5 w-[42%] rounded-xl border border-border bg-background/95 p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1.5">
                <span className="block h-2.5 w-28 rounded-full bg-muted-foreground/20" />
                <span className="block h-2 w-20 rounded-full bg-muted" />
              </div>
            </div>
            <div className="space-y-2">
              <span className="block h-2.5 rounded-full bg-muted" />
              <span className="block h-2.5 w-[82%] rounded-full bg-muted" />
              <span className="block h-2.5 w-[66%] rounded-full bg-muted" />
            </div>
          </div>

          <div className="board-empty-cursor absolute left-[28%] top-[128px] flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-primary shadow-md">
            <MousePointerClick className="h-4 w-4" />
          </div>
        </div>

        <div className="relative -mt-2 space-y-1">
          <p className="text-sm font-semibold text-foreground">게시글을 클릭해주세요</p>
          <p className="text-xs text-muted-foreground">왼쪽 목록에서 선택하면 오른쪽에 상세 내용이 열립니다.</p>
        </div>
      </div>
    </div>
  );
}

function DisabledWriteButton() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        aria-disabled="true"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-lg border border-border bg-muted px-4 text-sm font-medium text-muted-foreground"
      >
        <Pencil className="h-4 w-4" />
        글쓰기
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-lg border border-border bg-popover p-3 text-sm text-popover-foreground shadow-lg">
          <p className="font-medium">관리자만 작성 가능합니다.</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            공지사항은 관리자 게시글 관리에서 등록해주세요.
          </p>
        </div>
      )}
    </div>
  );
}
