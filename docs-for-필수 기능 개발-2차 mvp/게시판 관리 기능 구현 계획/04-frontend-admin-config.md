# 04-frontend-admin-config

관리자 — 게시판 자체(BoardConfig)의 CRUD. 새 게시판(이벤트, FAQ 등)을 추가하거나 기존 게시판의 정책(작성 권한, 댓글 허용 등)을 변경.

## 진입점

관리 드롭다운 → 운영 관리 → "게시판 설정" (`ADMIN_BOARD_CONFIGS`, path `/admin/board-configs`).

`restaurant-admin-menu` 스킬로 추가:
```
code: ADMIN_BOARD_CONFIGS
parentCode: ADMIN_OPERATIONS
한글: 게시판 설정
path: /admin/board-configs
icon: Settings2
description: 게시판을 추가하고 작성/댓글 정책을 관리합니다.
displayOrder: 5 (max+1)
페이지 stub: N (이 문서에서 직접 구현)
```

## 화면

### `/admin/board-configs/page.tsx`

```tsx
"use client";
import { RequireRole } from "@/widgets/guards/RequireRole";
import { BoardConfigManager } from "@/features/board-config-admin/BoardConfigManager";

export default function BoardConfigsPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN"]}>
      <main className="w-full px-4 py-4">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">게시판 설정</h1>
          <p className="text-sm text-muted-foreground">
            게시판을 추가하거나 작성·댓글 정책, 노출 순서를 관리합니다.
          </p>
        </header>
        <BoardConfigManager />
      </main>
    </RequireRole>
  );
}
```

### `BoardConfigManager.tsx`

테이블 + 우측 상단 "새 게시판" 버튼.

테이블 컬럼:
| 코드 | 종류 | 표시명 | 설명 | 고객 작성 | 댓글 | 활성 | 순서 | 액션 |
|---|---|---|---|---|---|---|---|---|
| notice | NOTICE | 공지사항 | 매장 소식과 안내 | ❌ | ❌ | ✅ | 0 | [수정] [비활성] |
| inquiry | INQUIRY | 문의 게시판 | 문의·요청을 남겨주세요 | ✅ | ✅ | ✅ | 1 | [수정] [비활성] |

- 코드 클릭 → 해당 게시판의 게시글 관리 화면(`/admin/boards?code=xxx`)으로 이동
- "비활성" → 사용자 측에서는 안 보임 (`isActive=false`). 다시 활성화는 [수정] 다이얼로그에서

### `BoardConfigDialog.tsx`

새 게시판 또는 기존 게시판 수정. 다이얼로그 형태(shadcn `Dialog`).

**필드:**
- `code` (신규일 때만 입력 가능, 정규식 `^[a-z0-9_-]+$`, 최대 100자) — 수정 시 read-only
- `kind` (신규일 때만 선택 — `NOTICE / INQUIRY / FAQ / EVENT`) — 수정 시 read-only
- `displayName` (필수, 200)
- `description` (선택, 500자, textarea)
- `allowCustomerWrite` (스위치 — 로그인 사용자 작성 허용)
- `allowComment` (스위치 — MVP에서는 답변만 가능. 향후 일반 댓글까지 확장 시 동작)
- `isActive` (스위치 — 수정 시만)
- `sortOrder` (number)

`code`와 `kind`를 수정 불가로 둔 이유: 수정하면 기존 게시글들이 떠 버린다. 새 게시판으로 만들고 글 이전 안내가 더 안전.

**Validation:**
- code 중복(이미 있는 코드) 시 즉시 에러 표시 — `boardConfigApi.list()`로 미리 받아둔 목록과 비교
- 시드 데이터(`notice`, `inquiry`)는 코드는 수정 불가지만 정책은 변경 가능. `allowCustomerWrite=false`이면 관리자만 작성 가능하고, true이면 로그인 사용자가 작성 가능하다.

**비활성화(soft delete):**
- 실제 DELETE 호출 → `isActive=false`. 게시글은 그대로 두되 사용자 측 라우트(`/boards/{code}`)에서 404. 관리자 화면에는 여전히 노출.
- 다시 활성화하려면 [수정] 다이얼로그에서 isActive 스위치 ON.

## API client

`src/entities/board/api/boardConfigApi.ts`:

```ts
import { api } from "@/shared/api/axios";
import type { BoardConfig } from "../model/types";

export interface CreateBoardConfigBody {
  code: string;
  kind: "NOTICE" | "INQUIRY" | "FAQ" | "EVENT";
  displayName: string;
  description: string;
  allowCustomerWrite: boolean;
  allowComment: boolean;
  sortOrder: number;
}

export interface UpdateBoardConfigBody {
  displayName: string;
  description: string;
  allowCustomerWrite: boolean;
  allowComment: boolean;
  isActive: boolean;
  sortOrder: number;
}

export const boardConfigApi = {
  list: () =>
    api.get<BoardConfig[]>("/api/admin/board-configs").then(r => r.data),

  create: (body: CreateBoardConfigBody) =>
    api.post<BoardConfig>("/api/admin/board-configs", body).then(r => r.data),

  update: (code: string, body: UpdateBoardConfigBody) =>
    api.patch<void>(`/api/admin/board-configs/${code}`, body),

  deactivate: (code: string) =>
    api.delete<void>(`/api/admin/board-configs/${code}`),
};
```

## React Query

```ts
const { data: configs } = useQuery({
  queryKey: ["admin-board-configs"],
  queryFn: boardConfigApi.list,
});

const createMut = useMutation({
  mutationFn: boardConfigApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["admin-board-configs"] });
    queryClient.invalidateQueries({ queryKey: ["board-configs"] });  // 사용자 측도 갱신
  },
});
```

## 새 게시판 추가 시 사용자측 헤더 메뉴는?

`BoardConfig`를 추가해도 자동으로 헤더 드롭다운(`BOARDS` 자식)에 안 잡힌다. 헤더는 `NavigationMenu` 시더 기반이기 때문.

**옵션 A (MVP):** 새 게시판은 `/boards/{code}` URL로 직접 접근 가능 + 사용자 측 게시판 목록 페이지(`/boards`)에서 활성 BoardConfig 전체를 카드 그리드로 노출. 헤더 드롭다운에는 NOTICE/INQUIRY 두 개만 고정.

**옵션 B (확장):** BoardConfig 추가 시 자동으로 NavigationMenu 항목도 생성하는 동기화 로직. 코드 명령식 추가가 아니라 시더 외부에서 이뤄지므로 NavigationMenuRepository 직접 호출. 다만 메뉴 라벨 i18n 키가 누락되니 라벨은 `BoardConfig.displayName` 그대로 사용.

→ **MVP는 A**. 옵션 B는 추후 결정. 옵션 A의 `/boards` 카드 페이지는 [03-frontend-customer.md](./03-frontend-customer.md)에는 없으니 여기서 추가:

`src/app/boards/page.tsx` — 활성 게시판 카드 그리드:
```tsx
const { data } = useQuery({ queryKey: ["board-configs"], queryFn: boardApi.configs });
return (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {data?.map((c) => (
      <Link key={c.code} href={`/boards/${c.code}`} className="rounded-lg border p-4 hover:shadow-md">
        <h3>{c.displayName}</h3>
        <p>{c.description}</p>
      </Link>
    ))}
  </div>
);
```

## 다음 문서

관리자 게시글/답변 관리 — [05-frontend-admin-posts.md](./05-frontend-admin-posts.md)
