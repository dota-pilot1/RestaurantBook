# 07. 메뉴 추가 상세 계획 (운영 관리 → 일정 관리)

[05-menu-dashboard-integration.md](./05-menu-dashboard-integration.md)의 실행 가능 버전. 실제 파일을 읽어 **그대로 복사 가능한** 코드 diff로 작성한다.

## 현재 운영 관리 메뉴 상태 (2026-05-09)

스크린샷 / 실제 코드 기준 운영 관리 children:

| displayOrder | code | label | path |
|---:|------|------|------|
| 0 | `ADMIN_DASHBOARD` | 대시보드 | `/dashboard` |
| 1 | `ADMIN_ORDERS` | 주문 관리 | `/orders` |
| 2 | `ADMIN_KITCHEN` | 주방 현황 | `/kitchen-board` |
| 3 | `ADMIN_SALES` | 매출 관리 | `/sales` |
| 4 | `ADMIN_BOARDS` | 게시글 관리 | `/admin/boards` |
| 5 | `ADMIN_BOARD_CONFIGS` | 게시판 설정 | `/admin/board-configs` |

**추가 결정**: `ADMIN_CALENDAR`를 `displayOrder=6`으로 마지막에 추가.

---

## 1) 백엔드: `NavigationMenuSeeder.java`

파일: [restaurant-book-server/src/main/java/com/cj/restaurantbook/config/NavigationMenuSeeder.java:49](restaurant-book-server/src/main/java/com/cj/restaurantbook/config/NavigationMenuSeeder.java:49)

49번 줄(`ADMIN_BOARD_CONFIGS` 정의) 바로 아래에 한 줄 추가.

```java
// before (49행)
new NavigationMenuDef("ADMIN_BOARD_CONFIGS",    "ADMIN_OPERATIONS", "게시판 설정", null,            "/admin/board-configs", "Settings",     RoleSeeder.ROLE_ADMIN,   5),

// after (50행 추가)
new NavigationMenuDef("ADMIN_BOARD_CONFIGS",    "ADMIN_OPERATIONS", "게시판 설정", null,            "/admin/board-configs", "Settings",     RoleSeeder.ROLE_ADMIN,   5),
new NavigationMenuDef("ADMIN_CALENDAR",         "ADMIN_OPERATIONS", "일정 관리", null,              "/admin/calendar",      "CalendarCheck2", RoleSeeder.ROLE_ADMIN, 6),
```

### 주의

- `requiredRole`은 `RoleSeeder.ROLE_ADMIN`. MVP는 ADMIN 단독.
- `icon`은 `CalendarCheck2`. lucide-react에 존재.
- `displayOrder=6`. 운영 관리 children의 다음 자리.
- `labelKey=null`. 다른 운영 관리 자식들도 대부분 null이므로 일관.

### 검증

- [ ] 백엔드 부팅 후 `navigation_menus` 테이블에 `ADMIN_CALENDAR` row 1건 생성
- [ ] `parent_id`가 `ADMIN_OPERATIONS` row의 id와 일치
- [ ] 두 번째 부팅 시 중복 생성 없이 update만 발생 (`NavigationMenuSeeder`의 upsert 동작 확인)

---

## 2) 프론트: `Header.tsx` 수정 3곳

파일: [restaurant-book-front/src/widgets/header/ui/Header.tsx](restaurant-book-front/src/widgets/header/ui/Header.tsx)

### 2-1) lucide-react import에 `CalendarCheck2` 추가

현재 (`Header.tsx:7-30`):

```tsx
import {
  BadgeCheck,
  BarChart3,
  BookOpen,
  ChevronDown,
  ClipboardList,
  ...
  Utensils,
} from "lucide-react";
```

변경: 알파벳 순으로 `BookOpen` 다음에 `CalendarCheck2` 추가.

```tsx
import {
  BadgeCheck,
  BarChart3,
  BookOpen,
  CalendarCheck2,   // ← 추가
  ChevronDown,
  ClipboardList,
  ...
  Utensils,
} from "lucide-react";
```

### 2-2) `fallbackNavigationMenus`에 `ADMIN_CALENDAR` 추가

현재 fallback의 운영 관리 자식 마지막 항목은 `ADMIN_BOARD_CONFIGS` (id `-25`, displayOrder `5`). 그 다음에 추가.

위치: `Header.tsx:473` (`-25` 항목 닫는 `},` 다음, `-100 GUIDE` 항목 직전)

```tsx
  {
    id: -25,
    code: "ADMIN_BOARD_CONFIGS",
    parentId: -3,
    label: "게시판 설정",
    labelKey: null,
    path: "/admin/board-configs",
    icon: "Settings",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 5,
    createdAt: "",
    updatedAt: "",
  },
  // ↓ 추가
  {
    id: -26,
    code: "ADMIN_CALENDAR",
    parentId: -3,
    label: "일정 관리",
    labelKey: null,
    path: "/admin/calendar",
    icon: "CalendarCheck2",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 6,
    createdAt: "",
    updatedAt: "",
  },
  // ↑ 추가
  {
    id: -100,
    code: "GUIDE",
    ...
  },
```

#### id 충돌 확인

현재 사용 중인 음수 id (확인된 것):
- 운영 관리 그룹: `-1` ~ `-7`, `-24` (ADMIN_BOARDS), `-25` (ADMIN_BOARD_CONFIGS)
- 상품 관리 그룹: `-8` ~ `-12`
- 사람·권한 그룹: `-13` ~ `-15` (이후)
- 설정 그룹 등: `-16` ~ `-23`
- 게시판: `-21`, `-22` 등
- 가이드: `-100`

`-26`은 충돌 없음. 작업 전에 grep으로 다시 확인:

```bash
grep -E "id: -[0-9]+" restaurant-book-front/src/widgets/header/ui/Header.tsx | sort -u
```

### 2-3) `adminMenuMeta`에 `ADMIN_CALENDAR` 추가

위치: `Header.tsx:498` (`ADMIN_BOARD_CONFIGS` 다음 줄)

```tsx
const adminMenuMeta: Record<string, { description: string; icon: LucideIcon }> = {
  ADMIN_DASHBOARD: { description: "주문, 매출, 운영 상태를 한 화면에서 확인합니다.", icon: LayoutDashboard },
  ADMIN_ORDERS: { description: "접수된 주문과 결제 상태를 관리합니다.", icon: ClipboardList },
  ADMIN_KITCHEN: { description: "주방 접수와 조리 진행 상태를 확인합니다.", icon: Utensils },
  ADMIN_SALES: { description: "일별 매출과 결제 흐름을 확인합니다.", icon: BarChart3 },
  ADMIN_BOARDS: { description: "게시글 노출, 고정, 문의 답변을 처리합니다.", icon: MessageSquare },
  ADMIN_BOARD_CONFIGS: { description: "게시판 종류와 작성 가능 여부를 설정합니다.", icon: Settings },
  ADMIN_CALENDAR: { description: "휴무, 프로모션, 단체예약, 운영 메모를 캘린더로 관리합니다.", icon: CalendarCheck2 },  // ← 추가
  ADMIN_SALE_MENUS: { description: "키오스크에서 판매할 메뉴와 가격을 관리합니다.", icon: ShoppingBag },
  ...
};
```

### Header.tsx 검증

- [ ] 관리자 로그인 후 헤더 `관리` 클릭 → 운영 관리 카드 마지막 항목으로 `일정 관리` 노출
- [ ] description이 `휴무, 프로모션, 단체예약, ...`으로 표시
- [ ] `CalendarCheck2` 아이콘 정상 렌더
- [ ] 일정 관리 클릭 시 `/admin/calendar` 이동
- [ ] NavigationMenu API 임의 차단(devtools에서 4xx 시뮬레이션) 후에도 fallback으로 일정 관리 노출

---

## 3) 프론트: `AdminDashboard.tsx` `operationLinks`

파일: [restaurant-book-front/src/features/admin-dashboard/AdminDashboard.tsx:84](restaurant-book-front/src/features/admin-dashboard/AdminDashboard.tsx:84)

### 현재 (84-89행)

```tsx
const operationLinks = [
  { href: "/manager", label: "매니저 대시보드", icon: LayoutDashboard },
  { href: "/sales", label: "매출 상세", icon: BarChart3 },
  { href: "/kitchen-board", label: "주방 현황", icon: Utensils },
  { href: "/staff", label: "직원 주문 보드", icon: ClipboardList },
];
```

### 변경

```tsx
const operationLinks = [
  { href: "/manager", label: "매니저 대시보드", icon: LayoutDashboard },
  { href: "/sales", label: "매출 상세", icon: BarChart3 },
  { href: "/kitchen-board", label: "주방 현황", icon: Utensils },
  { href: "/staff", label: "직원 주문 보드", icon: ClipboardList },
  { href: "/admin/calendar", label: "일정 관리", icon: CalendarCheck2 },  // ← 추가
];
```

### lucide import 추가

기존 import 줄에 `CalendarCheck2`를 알파벳 순서로 추가:

```tsx
import { BarChart3, CalendarCheck2, ClipboardList, LayoutDashboard, Megaphone, MessageSquare, Settings, Utensils } from "lucide-react";
```

(현재 정확한 import 라인은 파일 상단을 보고 알파벳 순으로 끼워 넣는다.)

### Grid 컬럼 수

현재 `xl:grid-cols-4` (`AdminDashboard.tsx:214`). [05-menu-dashboard-integration.md](./05-menu-dashboard-integration.md) 결정에 따라 **유지**.

5번째 카드(일정 관리)는 둘째 줄 첫 자리에 단독 배치된다. 시각적으로 어색하면 빈 자리에 placeholder 카드를 두지 않는다 — RestaurantBook은 grid auto-fill이 아니라 fixed cols라 자연스럽게 좌측 정렬된다.

### AdminDashboard 검증

- [ ] `/dashboard` (관리자) 진입 후 "운영 화면 바로가기" 섹션에 일정 관리 카드 노출
- [ ] 카드 클릭 시 `/admin/calendar` 이동
- [ ] 1366px / 1920px 양쪽에서 카드 폭이 첫 줄과 동일
- [ ] 모바일 (1열) 에서도 마지막에 자연스럽게 표시

---

## 4) i18n 처리 (선택)

`labelKey=null`이라 다국어 키 추가 없이도 한글 라벨로 동작한다. 다른 운영 관리 자식들(`ADMIN_ORDERS`, `ADMIN_SALES`, `ADMIN_BOARDS`, `ADMIN_BOARD_CONFIGS`)도 모두 `labelKey=null`이므로 일관성 유지.

다국어 메뉴까지 정렬하려면 후속 작업으로 4개 언어 모두 추가:

| 파일 | 추가 키 |
|------|------|
| [restaurant-book-front/src/shared/i18n/resources/ko/nav.ts](restaurant-book-front/src/shared/i18n/resources/ko/nav.ts) | `operationsCalendar: "일정 관리"` |
| [restaurant-book-front/src/shared/i18n/resources/en/nav.ts](restaurant-book-front/src/shared/i18n/resources/en/nav.ts) | `operationsCalendar: "Operations Calendar"` |
| [restaurant-book-front/src/shared/i18n/resources/ja/nav.ts](restaurant-book-front/src/shared/i18n/resources/ja/nav.ts) | `operationsCalendar: "運営スケジュール"` |
| [restaurant-book-front/src/shared/i18n/resources/zh/nav.ts](restaurant-book-front/src/shared/i18n/resources/zh/nav.ts) | `operationsCalendar: "运营日程"` |

후속 적용 시:
- `NavigationMenuSeeder`의 해당 def에서 `labelKey="nav.operationsCalendar"` 지정
- `Header.tsx` fallback에서 `labelKey: "nav.operationsCalendar"` 지정

MVP는 한글 고정으로 진행한다.

---

## 5) skill 활용 (선택)

이 모든 변경은 RestaurantBook 모노레포 환경에서 `restaurant-admin-menu` 스킬로도 자동화 가능하다. 다만 본 문서는 **수동 적용 시에도 자체 완결적**이도록 작성되어 있다.

수동 적용 시:
1. `NavigationMenuSeeder.java` 1줄 추가
2. `Header.tsx` 3곳 수정 (lucide import / fallback / adminMenuMeta)
3. `AdminDashboard.tsx` 2곳 수정 (lucide import / operationLinks)
4. 백엔드 재부팅 → DB 시드 자동 반영
5. 프론트 dev server reload

총 변경 파일: 백엔드 1, 프론트 2 (다국어 후속 시 +4)

---

## 통합 검증 시나리오

관리자 계정 로그인 후:

1. 헤더 `관리` 클릭 → 메가메뉴 `운영 관리` 카드 → **일정 관리**가 `게시판 설정` 다음 마지막 항목으로 노출
2. 일정 관리 클릭 → `/admin/calendar` 이동, 빈 캘린더 + 빈 목록 표시
3. `/dashboard` 이동 → "운영 화면 바로가기"에 일정 관리 카드 노출
4. 카드 클릭 → 동일 페이지 이동
5. 비관리자 (CUSTOMER) 로그인 후:
   - 헤더에 `관리` 메뉴 자체가 안 보임 (기존 동작)
   - URL 직접 진입 (`/admin/calendar`) → `RequireRole`가 차단 → `/unauthorized`
6. NavigationMenu API 의도적 차단 (브라우저 DevTools `Block request URL`로 `/api/navigation-menus` 차단) 후 새로고침:
   - fallback 메뉴 트리에서도 일정 관리 노출 확인

## 체크리스트

### 백엔드

- [ ] `NavigationMenuSeeder.java`에 `ADMIN_CALENDAR` def 1줄 추가
- [ ] 부팅 후 `navigation_menus`에 row 생성 확인
- [ ] 두 번째 부팅 시 중복 없음

### 프론트

- [ ] `Header.tsx` lucide import에 `CalendarCheck2` 추가
- [ ] `Header.tsx` `fallbackNavigationMenus`에 `id:-26` 항목 추가
- [ ] `Header.tsx` `adminMenuMeta`에 `ADMIN_CALENDAR` description 추가
- [ ] `AdminDashboard.tsx` lucide import에 `CalendarCheck2` 추가
- [ ] `AdminDashboard.tsx` `operationLinks`에 일정 관리 추가
- [ ] `npm run lint` 통과
- [ ] `npm run build` 통과

### 시나리오

- [ ] 관리자 헤더 메뉴 노출
- [ ] 관리자 대시보드 바로가기 노출
- [ ] 비관리자 차단
- [ ] fallback 메뉴 노출
