"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Pin, Trash2 } from "lucide-react";
import { adminBoardApi } from "@/entities/board/api/adminBoardApi";
import { boardConfigApi } from "@/entities/board/api/boardConfigApi";
import type { BoardDetail, BoardStatus } from "@/entities/board/model/types";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { RichTextEditor } from "@/shared/ui/lexical/RichTextEditor";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

const statusOptions: { value: BoardStatus; label: string }[] = [
  { value: "PUBLISHED", label: "게시" },
  { value: "HIDDEN", label: "숨김" },
  { value: "DRAFT", label: "임시" },
];

export function AdminBoardManagement() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("notice");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BoardDetail | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftStatus, setDraftStatus] = useState<BoardStatus>("PUBLISHED");

  const { data: configs = [] } = useQuery({
    queryKey: ["admin-board-configs"],
    queryFn: boardConfigApi.list,
  });
  const { data: unanswered } = useQuery({
    queryKey: ["admin-board-unanswered-count"],
    queryFn: adminBoardApi.unansweredInquiryCount,
  });
  const { data: page, isLoading } = useQuery({
    queryKey: ["admin-boards", code],
    queryFn: () => adminBoardApi.list(code, 0, 50),
  });
  const { data: detail } = useQuery({
    queryKey: ["admin-board", code, selectedId],
    queryFn: () => adminBoardApi.detail(code, selectedId as number),
    enabled: selectedId !== null,
  });
  const { data: comments = [] } = useQuery({
    queryKey: ["admin-board-comments", code, selectedId],
    queryFn: () => adminBoardApi.comments(code, selectedId as number),
    enabled: selectedId !== null,
  });

  useEffect(() => {
    if (!page?.content.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !page.content.some((post) => post.id === selectedId)) {
      setSelectedId(page.content[0].id);
    }
  }, [page, selectedId]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-boards", code] });
    queryClient.invalidateQueries({ queryKey: ["admin-board", code, selectedId] });
    queryClient.invalidateQueries({ queryKey: ["admin-board-comments", code, selectedId] });
    queryClient.invalidateQueries({ queryKey: ["admin-board-unanswered-count"] });
  };

  const createMutation = useMutation({
    mutationFn: () => adminBoardApi.create(code, { title: draftTitle, content: draftContent, status: draftStatus }),
    onSuccess: (post) => {
      setCreateOpen(false);
      setDraftTitle("");
      setDraftContent("");
      setDraftStatus("PUBLISHED");
      setSelectedId(post.id);
      invalidate();
    },
  });
  const visibilityMutation = useMutation({
    mutationFn: ({ id, visible }: { id: number; visible: boolean }) =>
      adminBoardApi.updateVisibility(code, id, visible),
    onSuccess: invalidate,
  });
  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: number; pinned: boolean }) =>
      pinned ? adminBoardApi.unpin(code, id) : adminBoardApi.pin(code, id),
    onSuccess: invalidate,
  });
  const replyMutation = useMutation({
    mutationFn: () => adminBoardApi.createComment(code, selectedId as number, reply),
    onSuccess: () => {
      setReply("");
      invalidate();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => adminBoardApi.delete(code, deleteTarget?.id as number),
    onSuccess: () => {
      setDeleteTarget(null);
      invalidate();
    },
  });

  return (
    <RequireRole roles={["ROLE_ADMIN"]}>
      <main className="w-full px-4 py-4">
        <header className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">게시글 관리</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              게시글 노출, 고정, 문의 답변 상태를 관리합니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-9 items-center rounded-md border border-border bg-muted px-3 text-sm">
              미답변 문의 {unanswered?.count ?? 0}
            </span>
            <select
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setSelectedId(null);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {configs.map((config) => (
                <option key={config.code} value={config.code}>
                  {config.displayName}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              글 등록
            </button>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="w-20 px-3 py-2 text-left font-medium">상태</th>
                  <th className="px-3 py-2 text-left font-medium">제목</th>
                  <th className="hidden w-36 px-3 py-2 text-left font-medium md:table-cell">작성일</th>
                  <th className="w-36 px-3 py-2 text-right font-medium">처리</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-10 text-center text-muted-foreground">
                      게시글을 불러오는 중입니다.
                    </td>
                  </tr>
                ) : page?.content.length ? (
                  page.content.map((post) => (
                    <tr
                      key={post.id}
                      className={`border-t border-border ${selectedId === post.id ? "bg-accent" : ""}`}
                    >
                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-md border border-border bg-background px-2 py-1 text-xs">
                          {post.status === "PUBLISHED" ? "게시" : post.status === "HIDDEN" ? "숨김" : "임시"}
                        </span>
                      </td>
                      <td className="min-w-0 px-3 py-3">
                        <button
                          type="button"
                          onClick={() => setSelectedId(post.id)}
                          className="block max-w-full truncate text-left font-medium hover:text-primary"
                        >
                          {post.pinned && <span className="mr-1 text-primary">[고정]</span>}
                          {post.title}
                        </button>
                        {post.boardCode === "inquiry" && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {post.answered ? "답변완료" : "미답변"}
                          </p>
                        )}
                      </td>
                      <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">
                        {formatDate(post.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => visibilityMutation.mutate({ id: post.id, visible: post.status !== "PUBLISHED" })}
                            className="h-8 rounded-md border border-input px-2 text-xs hover:bg-background"
                          >
                            {post.status === "PUBLISHED" ? "숨김" : "노출"}
                          </button>
                          <button
                            type="button"
                            onClick={() => pinMutation.mutate({ id: post.id, pinned: post.pinned })}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-background"
                            aria-label={post.pinned ? "고정 해제" : "고정"}
                          >
                            <Pin className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-10 text-center text-muted-foreground">
                      등록된 게시글이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <aside className="rounded-lg border border-border p-4">
            {detail ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold leading-7">{detail.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {detail.authorName} · {formatDate(detail.createdAt)} · 조회 {detail.viewCount}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(detail)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-destructive/50 text-destructive hover:bg-destructive/10"
                    aria-label="게시글 삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <RichTextEditor
                  key={`admin-view-${detail.id}-${detail.updatedAt}`}
                  value={detail.content}
                  readOnly
                  minHeight="180px"
                />
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">답변</h3>
                  {comments.map((comment) => (
                    <div key={comment.id} className="rounded-md border border-border p-3 text-sm">
                      <p className="whitespace-pre-wrap leading-6">{comment.content}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {comment.authorName} · {formatDate(comment.createdAt)}
                      </p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-sm text-muted-foreground">등록된 답변이 없습니다.</p>
                  )}
                </section>
                <form
                  className="space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    replyMutation.mutate();
                  }}
                >
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    required
                    rows={4}
                    placeholder="답변 내용"
                    className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="submit"
                    disabled={replyMutation.isPending}
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
                  >
                    <MessageSquare className="h-4 w-4" />
                    답변 등록
                  </button>
                </form>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">게시글을 선택하세요.</p>
            )}
          </aside>
        </section>

        <ConfirmDialog
          open={deleteTarget !== null}
          title="게시글을 삭제할까요?"
          confirmText="삭제"
          variant="destructive"
          loading={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate()}
        />

        {createOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <form
              className="w-full max-w-2xl rounded-lg border border-border bg-background p-5 shadow-lg"
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
            >
              <h2 className="text-lg font-semibold">게시글 등록</h2>
              <div className="mt-4 space-y-3">
                <input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  required
                  maxLength={500}
                  placeholder="제목"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <select
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value as BoardStatus)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <RichTextEditor value={draftContent} onChange={setDraftContent} minHeight="280px" />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="h-9 rounded-md border border-input px-3 text-sm hover:bg-accent"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !draftTitle.trim() || !draftContent.trim()}
                  className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </RequireRole>
  );
}
