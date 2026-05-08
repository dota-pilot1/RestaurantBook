# 05-frontend-admin-posts

관리자 — 게시글/답변 관리. 공지 작성, 문의 답변, 핀 고정, 미답변 알림.

## 진입점

관리 드롭다운 → 운영 관리 → "게시글 관리" (`ADMIN_BOARDS`, path `/admin/boards`).

`restaurant-admin-menu` 스킬로 추가:
```
code: ADMIN_BOARDS
parentCode: ADMIN_OPERATIONS
한글: 게시글 관리
path: /admin/boards
icon: ClipboardList
description: 공지·문의 게시글을 등록하고 답변합니다.
displayOrder: 4 (max+1)
페이지 stub: N
```

미답변 카운트는 헤더 우측 종 아이콘 또는 메뉴 항목 옆 빨간 배지로도 표시 (옵션). MVP는 메뉴 옆 배지만.

## 화면 구조

`/admin/boards` 한 페이지에 **좌측 게시판 선택 사이드바 + 우측 게시글 목록·상세** 2-pane 레이아웃.

```
┌──────────────────┬───────────────────────────────────────────────┐
│ 게시판            │  [게시판: 문의 게시판]            [+ 새 글]   │
│                  │                                                │
│ ▸ 공지사항 (3)   │  ┌─ 목록 ────────────────────┬─ 상세 ──────┐  │
│ ▸ 문의 게시판 (8) │  │ 📌 [공지] 5월 휴무 안내   │ [선택된 글] │  │
│   미답변(2)      │  │   2026-05-08 · 김철수    │             │  │
│                  │  │ ─────────────────────── │ 본문…        │  │
│ ▸ (게시판 추가...)│  │ ✉ 김치찌개 문의 (미답변) │             │  │
│                  │  │   2026-05-07 · 손**고객 │ ─────────── │  │
│                  │  │ ✓ 영업시간 (답변완료)    │ 답변(1)     │  │
│                  │  │   2026-05-06 · 박**     │ • 관리자…   │  │
│                  │  │                          │             │  │
│                  │  │ [페이지네이션]           │ [답변 작성] │  │
│                  │  └──────────────────────────┴─────────────┘  │
└──────────────────┴───────────────────────────────────────────────┘
```

기존 어드민 화면들이 이미 마스터-디테일 패턴을 쓰고 있어서 정합성 유지. URL 쿼리스트링으로 선택 상태 보존: `/admin/boards?code=inquiry&id=42`.

## 컴포넌트 트리

```
AdminBoardsPage  (page.tsx, RequireRole 래핑)
└── AdminBoardWorkspace
    ├── BoardSidebar
    │    └── (활성 BoardConfig 목록 + 미답변 배지)
    └── BoardWorkspace (선택된 code 기준)
        ├── BoardHeader
        │    └── ([+ 새 글] 버튼)
        ├── AdminBoardTable
        │    └── (페이지네이션, 행 클릭 시 ?id= 변경)
        └── BoardDetailPane
            ├── BoardDetailHeader (제목, 작성자, 액션 [핀] [숨김] [삭제])
            ├── BoardContent
            ├── CommentList (관리자 답변 + 일반 댓글 — MVP는 답변만)
            └── BoardCommentForm (답변 작성)
```

## 핵심 기능

### 새 글 작성 (`AdminBoardEditor`)

다이얼로그 또는 별도 페이지(`/admin/boards/{code}/new`).
- 공지: 일반적인 제목/본문
- 문의: 관리자가 직접 문의를 작성하는 케이스는 드물지만 차단할 필요는 없음. 공지와 동일한 폼 사용

본문 에디터는 MVP에서는 단순 textarea. 마크다운/리치 에디터는 별도 PR.

### 답변 작성 (`BoardCommentForm`)

```tsx
<form onSubmit={...}>
  <Textarea value={content} onChange={...} placeholder="답변을 입력하세요" />
  <Button type="submit">답변 등록</Button>
</form>
```

POST `/api/admin/boards/{code}/{id}/comments` → 성공 시 `["board-comments"]` invalidate + `["admin-unanswered-count"]` invalidate.

답변 등록 시 백엔드가 `INQUIRY_ANSWERED` WS 브로드캐스트 → 다른 관리자 탭의 미답변 카운트 자동 감소.

### 핀 고정 / 해제

`PinToggleButton` — 단일 버튼이 현재 상태 보고 토글:
- 핀 안 됨 → POST `/{id}/pin`
- 핀 됨 → DELETE `/{id}/pin`

핀 순서 재정렬은 MVP에서 안 함 (나중 요청 시 별도 PR — drag-and-drop으로). `pin()` 호출 시 백엔드가 자동으로 max+1 부여.

### 숨김 / 삭제

- **숨김** (status PUBLISHED ↔ HIDDEN): 사용자 측 목록에서 숨김. 관리자에게는 회색 처리되어 표시. PATCH로 status 필드 변경하는 별도 엔드포인트(`/visibility`) 추가하거나, 본문 PATCH에 status 포함 — 본 문서는 후자(간결).
- **삭제** (soft delete): 사용자/관리자 모두에서 사라짐. 복구는 DB 직접. MVP는 휴지통 미구현.

확인 다이얼로그 둘 다 띄움.

### 미답변 카운트

- API: `GET /api/admin/boards/inquiries/unanswered/count` → `{ count: 2 }`
- 사이드바 "문의 게시판" 옆 배지에 표시
- 또한 헤더의 `ADMIN` 메가메뉴 안 "게시글 관리" 옆에도 작은 배지 (옵션)

WS `INQUIRY_CREATED` / `INQUIRY_ANSWERED` 수신 시:
```ts
queryClient.setQueryData(["admin-unanswered-count"], (old: { count: number }) => ({
  count: Math.max(0, old.count + (event === "INQUIRY_CREATED" ? +1 : -1)),
}));
```

WS 구독은 토픽 `boards:operations` (관리자 권한 필요).

## API client

`src/entities/board/api/adminBoardApi.ts`:

```ts
export const adminBoardApi = {
  list: (code: string, page: number, size = 20) =>
    api.get<PageResp<BoardSummary>>(`/api/admin/boards/${code}`, { params: { page, size } }).then(r => r.data),

  unansweredCount: () =>
    api.get<{ count: number }>("/api/admin/boards/inquiries/unanswered/count").then(r => r.data),

  create: (code: string, body: { title: string; content: string }) =>
    api.post<BoardDetail>(`/api/admin/boards/${code}`, body).then(r => r.data),

  update: (code: string, id: number, body: { title: string; content: string }) =>
    api.patch<void>(`/api/admin/boards/${code}/${id}`, body),

  remove: (code: string, id: number) =>
    api.delete<void>(`/api/admin/boards/${code}/${id}`),

  pin:   (code: string, id: number) => api.post<void>(`/api/admin/boards/${code}/${id}/pin`),
  unpin: (code: string, id: number) => api.delete<void>(`/api/admin/boards/${code}/${id}/pin`),

  reply: (code: string, id: number, body: { content: string }) =>
    api.post<BoardComment>(`/api/admin/boards/${code}/${id}/comments`, body).then(r => r.data),

  updateReply: (commentId: number, body: { content: string }) =>
    api.patch<void>(`/api/admin/comments/${commentId}`, body),

  deleteReply: (commentId: number) =>
    api.delete<void>(`/api/admin/comments/${commentId}`),
};
```

## React Query 키

```ts
["admin-board-list", code, page]
["admin-board-detail", code, id]
["board-comments", code, id]   // 공개와 동일 — 관리자도 같은 데이터
["admin-unanswered-count"]
```

mutation 후 invalidate 매트릭스:

| Mutation | Invalidate |
|---|---|
| create / update / delete | `["admin-board-list", code]`, `["admin-board-detail"]`, `["admin-unanswered-count"]` |
| pin / unpin | `["admin-board-list", code]` |
| reply / deleteReply | `["board-comments", code, id]`, `["admin-unanswered-count"]`, `["admin-board-list", code]` |
| updateReply | `["board-comments", code, id]` |

## WebSocket 구독 (관리자 화면)

```tsx
useEffect(() => {
  const unsub = appWebSocket.subscribe("boards:operations", (msg) => {
    if (msg.type === "INQUIRY_CREATED" || msg.type === "INQUIRY_ANSWERED") {
      queryClient.invalidateQueries({ queryKey: ["admin-unanswered-count"] });
      queryClient.invalidateQueries({ queryKey: ["admin-board-list", "inquiry"] });
    }
  });
  return unsub;
}, []);
```

`appWebSocket` 클라이언트는 기존 스태프 호출 도메인에서 이미 사용 중이므로 같은 모듈 재사용.

## 익명 작성자 노출

관리자 화면에서는 익명 작성자도 **마스킹 없이** 전체 정보 노출:
- 이름 (전체)
- 연락처 (전체) — 답변 등록 후 SMS/메일 안내가 필요할 수 있음
- tableId (있으면) — 어느 테이블에서 작성했는지 추적

## 빈 상태 / 에러

- 게시판 목록 빈 경우(BoardConfig 0개): "사이드바의 [게시판 추가]를 눌러 첫 게시판을 만드세요" + 게시판 설정 화면 링크
- 게시글 0개: "이 게시판에 등록된 글이 없습니다." + [+ 새 글] 버튼
- 비번 잘못된 익명 글 수정 시도: 백엔드 403 → 토스트
- 답변 본문 비었을 때 등록: 클라이언트 validation으로 차단

## 다음 문서

단계별 작업 순서 — [06-step-by-step.md](./06-step-by-step.md)
