# 05. 메뉴 + 대시보드 연결 (개요)

> **실행 가능한 상세 코드 diff는 [07-menu-addition-detailed.md](./07-menu-addition-detailed.md)에 있다.** 본 문서는 결정과 구조만 다룬다.

## 목표

일정 관리 페이지를 RestaurantBook의 운영 관리 메뉴에 자연스럽게 넣는다.

위치:

```
관리
└── 운영 관리
    ├── 대시보드
    ├── 주문 관리
    ├── 주방 현황
    ├── 매출 관리
    ├── 게시글 관리
    ├── 게시판 설정
    └── 일정 관리
```

## NavigationMenuSeeder

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/config/NavigationMenuSeeder.java`

`ADMIN_OPERATIONS` 자식으로 아래 항목을 추가한다.

```java
new NavigationMenuDef(
        "ADMIN_CALENDAR",
        "ADMIN_OPERATIONS",
        "일정 관리",
        null,
        "/admin/calendar",
        "CalendarCheck2",
        RoleSeeder.ROLE_ADMIN,
        6
)
```

현재 순서:
- `ADMIN_DASHBOARD` 0
- `ADMIN_ORDERS` 1
- `ADMIN_KITCHEN` 2
- `ADMIN_SALES` 3
- `ADMIN_BOARDS` 4
- `ADMIN_BOARD_CONFIGS` 5

따라서 `ADMIN_CALENDAR`는 6이 자연스럽다.

## Header fallback 메뉴

파일: `restaurant-book-front/src/widgets/header/ui/Header.tsx`

`fallbackNavigationMenus`에도 같은 항목을 추가한다. API 실패 시에도 메뉴가 보이는 fallback이므로 시더와 함께 맞춰야 한다.

추가 위치:
- `ADMIN_OPERATIONS` 자식
- 가능하면 `ADMIN_BOARD_CONFIGS` 다음
- 현재 fallback 배열이 DB 시더보다 오래되어 `ADMIN_BOARDS`, `ADMIN_BOARD_CONFIGS`가 없을 수 있으므로, 그 경우 `ADMIN_SALES` 다음 운영 관리 그룹 안에 추가한다.
- id는 음수 임시값 중 충돌 없는 값 사용

필드:

```ts
{
  id: -24,
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
}
```

주의:
- 기존 fallback에는 음수 id가 이미 많으므로 실제 작업 전 현재 배열을 확인하고 충돌 없는 id를 쓴다.
- fallback 메뉴는 API 장애 시 대체용이므로 `NavigationMenuSeeder`와 100% 동일하지 않을 수 있다. 그래도 `ADMIN_CALENDAR`는 운영 관리 그룹 안에 있어야 한다.

## adminMenuMeta

파일: `restaurant-book-front/src/widgets/header/ui/Header.tsx`

lucide import에 `CalendarCheck2`를 추가하고, `adminMenuMeta`에 아래 항목을 추가한다.

```ts
ADMIN_CALENDAR: {
  description: "휴무, 프로모션, 단체예약, 운영 메모를 캘린더로 관리합니다.",
  icon: CalendarCheck2,
},
```

## 관리자 대시보드 바로가기

파일: `restaurant-book-front/src/features/admin-dashboard/AdminDashboard.tsx`

`operationLinks`에 일정 관리를 추가한다.

```ts
{ href: "/admin/calendar", label: "일정 관리", icon: CalendarCheck2 },
```

현재 `operationLinks`는 4개라 `xl:grid-cols-4`에 맞다. 일정 관리까지 넣으면 5개가 된다.

**결정: `xl:grid-cols-4` 유지 + 둘째 줄 첫 자리에 일정 관리 배치.**

이유:
- `xl:grid-cols-5`로 바꾸면 1366px 환경에서 카드 폭이 좁아지고, 카드 내부 텍스트(설명 2줄)가 줄바꿈 위치가 어색해진다.
- 4열 유지 시 일정 관리 카드는 둘째 줄에 단독 배치되지만, 다음 운영 기능이 추가되면 자연스럽게 채워진다.
- 시각적 안정성을 우선하고, 구현 변경 폭도 최소화된다.

검증:
- 1366px / 1920px에서 둘째 줄 카드가 첫 줄 카드 폭과 동일한지 확인.
- 모바일 1열 레이아웃은 영향 없음.

## i18n

이번 메뉴는 `labelKey=null`로 두면 i18n 키 추가 없이 한글 고정 라벨로 동작한다.

다국어 메뉴까지 맞추려면:
- `restaurant-book-front/src/shared/i18n/resources/ko/nav.ts`
- `restaurant-book-front/src/shared/i18n/resources/en/nav.ts`
- `restaurant-book-front/src/shared/i18n/resources/ja/nav.ts`
- `restaurant-book-front/src/shared/i18n/resources/zh/nav.ts`

에 `calendar` 또는 `operationsCalendar` 키를 추가하고 `labelKey`를 지정한다.

MVP에서는 기존 운영 관리 하위 메뉴들도 대부분 `labelKey=null`이므로 한글 라벨로 충분하다.

## 권한 주의

헤더의 `buildTree`는 현재 다음 조건으로 메뉴를 필터링한다.

```ts
m.visible && (!m.requiredRole || m.requiredRole === userRole)
```

즉, `requiredRole`은 단일 역할만 지원한다. `ROLE_ADMIN`, `ROLE_MANAGER` 둘 다 노출하려면 이 구조를 바꿔야 한다.

이번 MVP에서는 `ROLE_ADMIN`으로 고정한다.

## 검증

- [ ] 백엔드 부팅 후 `navigation_menus`에 `ADMIN_CALENDAR` 생성
- [ ] 두 번째 부팅 시 중복 생성 없이 update
- [ ] 관리자 계정 헤더에서 `관리 > 운영 관리 > 일정 관리` 노출
- [ ] 메뉴 클릭 시 `/admin/calendar` 이동
- [ ] `adminMenuMeta` description/icon 정상 표시
- [ ] NavigationMenu API 실패 상황에서도 fallback 메뉴로 일정 관리 노출
- [ ] 관리자 대시보드 바로가기 추가 시 레이아웃 깨짐 없음
