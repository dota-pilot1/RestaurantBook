# 03-frontend-customer

로그인 사용자에게 헤더 중앙 "게시판" 드롭다운으로 공지사항/문의 게시판 진입을 제공한다. 비로그인 일반 유저와 테이블 익명 고객은 게시판 자체를 보지 않아도 되는 정책이다.

## 헤더 메뉴 추가

### 1. 시더 변경 (`NavigationMenuSeeder.java`)

루트(parent=null) 항목 `BOARDS`와 자식 두 개를 추가. 기존 `ADMIN`의 displayOrder를 밀어서 가운데 위치 확보.

```java
// 기존 변경
new NavigationMenuDef("DASHBOARD", null, "대시보드", "nav.dashboard",
        "/dashboard", "LayoutDashboard", null, 0),
new NavigationMenuDef("BOARDS",    null, "게시판",   "nav.boards",
        null,        "MessageSquare",   null, 1),  // 로그인 사용자 헤더에서 노출 (requiredRole=null)
new NavigationMenuDef("ADMIN",     null, "관리",     "nav.admin",
        null,        "Settings",        RoleSeeder.ROLE_ADMIN, 2),  // displayOrder 1→2

// BOARDS 자식
new NavigationMenuDef("BOARD_NOTICE",  "BOARDS", "공지사항",    "nav.boardNotice",
        "/boards/notice",  "Megaphone",     null, 0),
new NavigationMenuDef("BOARD_INQUIRY", "BOARDS", "문의 게시판", "nav.boardInquiry",
        "/boards/inquiry", "MessageSquare", null, 1),
```

### 2. i18n nav.ts (4개 언어)

ko:
```ts
boards: "게시판",
boardNotice: "공지사항",
boardInquiry: "문의 게시판",
```
en:
```ts
boards: "Boards",
boardNotice: "Notices",
boardInquiry: "Inquiries",
```
ja:
```ts
boards: "掲示板",
boardNotice: "お知らせ",
boardInquiry: "お問い合わせ",
```
zh:
```ts
boards: "公告栏",
boardNotice: "通知",
boardInquiry: "咨询",
```

### 3. 일반 드롭다운 처리

현재 RestaurantBook `Header.tsx`에는 `AdminMegaMenu`와 일반 `DropdownMenu`가 이미 있다. 따라서 신규 `UserNavDropdown`을 반드시 만들 필요는 없다. 우선 기존 `DropdownMenu`를 사용하고, 게시판 드롭다운에 아이콘/설명 등 별도 UI가 필요해질 때만 `UserNavDropdown`으로 분리한다.

헤더 navTree는 기존 정책대로 `status === "authenticated"`일 때만 렌더링한다. 비로그인 일반 유저에게 게시판 헤더 메뉴를 노출하지 않는다.

필요 시 분리할 컴포넌트 예시는 아래와 같다.

`src/widgets/header/ui/UserNavDropdown.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { resolveLucideIcon } from "@/shared/ui/icons/resolveLucideIcon";
import type { NavigationMenuItem } from "@/entities/navigation-menu/model/types";

export function UserNavDropdown({ item }: { item: NavigationMenuItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const children = item.children.filter((c) => c.path);
  const isActive = children.some((c) => c.path && pathname.startsWith(c.path));

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors ${
          isActive || open
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        {item.label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-border bg-background p-2 shadow-xl">
          {children.map((c) => {
            const Icon = resolveLucideIcon(c.icon);
            const active = c.path && pathname.startsWith(c.path);
            return (
              <Link
                key={c.id}
                href={c.path!}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                  active ? "bg-accent text-foreground" : "hover:bg-accent"
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{c.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

### 4. Header.tsx 분기 수정

기존 헤더 렌더 부분에서 루트 메뉴 처리:
- `code === "ADMIN"` → `AdminMegaMenu` (기존)
- 자식이 있고 ADMIN이 아님 → 기존 `DropdownMenu` 또는 분리한 `UserNavDropdown`
- 자식 없음, path 있음 → 단순 NavLink (기존)

```tsx
{rootItems.map((item) => {
  if (item.children.length > 0) {
    return item.code === "ADMIN"
      ? <AdminMegaMenu key={item.id} item={item} />
      : <DropdownMenu key={item.id} item={item} />;
  }
  return <NavLink key={item.id} href={item.path!}>{item.label}</NavLink>;
})}
```

`resolveLucideIcon` 헬퍼는 `UserNavDropdown`을 별도 분리하고 아이콘을 렌더링할 때만 필요하다. 기존 `DropdownMenu`를 그대로 쓰면 이번 MVP에서는 생략 가능.

## entities 계층

`src/entities/board/`:

### `model/types.ts`

```ts
export type BoardKind = "NOTICE" | "INQUIRY" | "FAQ" | "EVENT";
export type BoardStatus = "PUBLISHED" | "HIDDEN" | "DRAFT";

export interface BoardConfig {
  id: number;
  code: string;
  kind: BoardKind;
  displayName: string;
  description: string | null;
  allowCustomerWrite: boolean;
  allowComment: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface BoardSummary {
  id: number;
  boardCode: string;
  title: string;
  authorName: string;
  isPinned: boolean;
  isAnswered: boolean;
  viewCount: number;
  createdAt: string;
}

export interface BoardDetail extends BoardSummary {
  content: string;
  canEdit: boolean;
  updatedAt: string;
}

export interface BoardComment {
  id: number;
  boardId: number;
  authorName: string;
  content: string;
  isAdminReply: boolean;
  createdAt: string;
}

export interface PageResp<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;  // current page (0-based)
  size: number;
}
```

### `api/boardApi.ts`

```ts
import { api } from "@/shared/api/axios";
import type { BoardConfig, BoardDetail, BoardSummary, BoardComment, PageResp } from "../model/types";

export const boardApi = {
  configs: () => api.get<BoardConfig[]>("/api/boards/configs").then(r => r.data),

  list: (code: string, page = 0, size = 20) =>
    api.get<PageResp<BoardSummary>>(`/api/boards/${code}`, { params: { page, size } }).then(r => r.data),

  detail: (code: string, id: number) =>
    api.get<BoardDetail>(`/api/boards/${code}/${id}`).then(r => r.data),

  comments: (code: string, id: number) =>
    api.get<BoardComment[]>(`/api/boards/${code}/${id}/comments`).then(r => r.data),

  create: (code: string, body: BoardWriteBody) =>
    api.post<BoardDetail>(`/api/boards/${code}`, body).then(r => r.data),

  update: (code: string, id: number, body: BoardWriteBody) =>
    api.patch<void>(`/api/boards/${code}/${id}`, body),

  remove: (code: string, id: number) =>
    api.delete<void>(`/api/boards/${code}/${id}`),
};

export interface BoardWriteBody {
  title: string;
  content: string;
}
```

게스트 비밀번호 저장소는 만들지 않는다. 수정/삭제 가능 여부는 서버가 로그인 사용자와 게시글 작성자/관리자 권한으로 판단한다.

## 페이지 라우트

### `src/app/boards/[code]/page.tsx` — 목록

```tsx
"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { boardApi } from "@/entities/board/api/boardApi";
import { BoardListView } from "@/features/board-customer/BoardListView";

export default function BoardListPage() {
  const { code } = useParams<{ code: string }>();
  const sp = useSearchParams();
  const page = Number(sp.get("page") ?? "0");

  const { data: cfg } = useQuery({
    queryKey: ["board-configs"],
    queryFn: boardApi.configs,
  });
  const config = cfg?.find((c) => c.code === code);

  const { data: list } = useQuery({
    queryKey: ["board-list", code, page],
    queryFn: () => boardApi.list(code, page, 20),
  });

  if (!config) return null;
  return (
    <main className="w-full px-4 py-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{config.displayName}</h1>
        {config.description && (
          <p className="text-sm text-muted-foreground">{config.description}</p>
        )}
      </header>
      <BoardListView config={config} page={list} />
    </main>
  );
}
```

### `src/app/boards/[code]/[id]/page.tsx` — 상세

상세 페이지에서는:
- 본문 + 작성자 + 작성일 + 조회수
- 답변(`isAdminReply=true` 댓글) 표시 영역 (없으면 "답변 대기 중")
- `canEdit=true`이면 우측에 "수정/삭제" 버튼 표시

### `features/board-customer/BoardListView.tsx`

마스터-디테일 분리 안 하고 표 형태로 단순 목록 + 페이지네이션. 핀 글은 상단 강조(배경색 + 📌 아이콘).

`BoardListView` props:
- `config: BoardConfig`
- `page: PageResp<BoardSummary> | undefined`

표 컬럼: NO / 제목(✓ 답변완료 뱃지 if INQUIRY) / 작성자 / 작성일 / 조회수
하단: 페이지네이션 + (`config.allowCustomerWrite` true면) "글쓰기" 버튼 → `/boards/{code}/new`

### `features/board-customer/InquiryWriteForm.tsx`

문의 게시판 새 글 작성. 로그인 사용자는 다음 입력:
- 제목 (필수, 500자)
- 내용 (필수, Lexical 리치텍스트 에디터 JSON 저장)

작성자 이름은 로그인 사용자 정보에서 서버가 결정한다.

성공 시 → `/boards/inquiry/{newId}` 로 이동.

## React Query 키 컨벤션

```ts
["board-configs"]
["board-list", code, page]
["board-detail", code, id]
["board-comments", code, id]
```

작성/수정/삭제 mutation 후 invalidate:
- create: `["board-list", code]` 전체 페이지
- update: `["board-detail", code, id]` + `["board-list", code]`
- delete: 동일

## 빈 상태 / 에러

- 게시글 0개: "아직 등록된 글이 없습니다." + (allowCustomerWrite면) "첫 글을 남겨보세요" CTA
- 비활성 게시판(`isActive=false`)에 직접 URL 진입: 404
- 비로그인 접근: 로그인 페이지로 이동 또는 401 처리
- 작성자 외 수정/삭제: 토스트 "수정 권한이 없습니다."

## 다음 문서

관리자 게시판 설정 CRUD — [04-frontend-admin-config.md](./04-frontend-admin-config.md)
