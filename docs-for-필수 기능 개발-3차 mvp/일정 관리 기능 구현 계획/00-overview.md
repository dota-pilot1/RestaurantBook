# 00. Overview

## 목표

식당 운영자가 내부 운영 일정을 월간 캘린더로 관리할 수 있게 한다.

주요 사용 예:
- 임시 휴무, 공휴일 휴무
- 신메뉴 출시/할인 이벤트
- 단체예약/대관 메모
- 재료 발주, 설비 점검, 청소 일정
- 직원에게 공유할 운영 공지

이번 MVP에서는 일정이 주문/테이블/영업시간을 자동으로 바꾸지 않는다. **운영자가 보는 내부 캘린더**로 먼저 완성한다.

## 최종 UX

BeautyBook의 관리자 일정 화면과 같은 구조를 유지한다.

```
┌────────────────────────────────┬──────────────────────────────────┐
│  2026년 5월        < 오늘 >     │ 이 달 일정 (12건)   [+ 새 일정]   │
│ ────────────────────────────── │ ──────────────────────────────── │
│ 일 월 화 수 목 금 토            │ 날짜 | 타입 | 시간 | 제목         │
│  …  …  …  …  5  6  7           │ 05/05 | 휴무 | - | 어린이날 휴무 │
│  …  …  … 8●● …  …  …           │ 05/08 | 이벤트 | 18:00 | 단체예약 │
│                                │ 05/12 | 메모 | 오전 | 식자재 발주 │
│ 셀에는 타입별 점만 표시         │                                  │
│ 셀 클릭 시 우측 목록 날짜 필터  │ 행 클릭 시 수정/삭제 모달         │
└────────────────────────────────┴──────────────────────────────────┘
```

## 일정 타입

BeautyBook enum을 그대로 유지한다. 식당 특화 타입을 새로 늘리면 백엔드/프론트/시드/필터가 같이 늘어나므로 MVP에서는 라벨과 안내 문구만 바꾼다.

| enum | BeautyBook 라벨 | RestaurantBook 라벨/의미 |
|------|-----------------|--------------------------|
| `NOTICE` | 공지 | 운영 공지 |
| `HOLIDAY` | 휴무 | 휴무/임시휴업 |
| `EVENT` | 이벤트 | 프로모션/단체예약 |
| `MEMO` | 메모 | 발주/점검/운영 메모 |

후속에서 정말 분리가 필요하면 `RESERVATION`, `PREP`, `MAINTENANCE`를 추가한다. 특히 `RESERVATION` 분리 시점에는 `time_text`(자유 텍스트)를 `LocalTime startAt/endAt`로 마이그레이션하고 `restaurant_table` 시간 점유와 연결한다.

## 권한

MVP는 BeautyBook과 동일하게 `ROLE_ADMIN`만 접근한다.

RestaurantBook에는 `ROLE_MANAGER`도 있지만 현재 헤더의 DB 내비게이션은 `requiredRole` 단일 값으로 필터링한다. `관리 > 운영 관리` 트리 자체가 `ROLE_ADMIN`에 묶여 있으므로, 매니저에게도 일정 관리를 열려면 별도 작업이 필요하다.

후속 선택지:
- `/manager` 대시보드에 일정 관리 바로가기 추가
- `navigation_menus.required_role`을 다중 역할 또는 권한 기반으로 확장
- `requiredPermission` 기반 필터를 Header에 실제 적용

## 아키텍처

```
restaurant-book-front
├── src/app/admin/calendar
│   ├── page.tsx
│   ├── _lib/calendar.ts
│   └── _components
│       ├── CalendarGrid.tsx
│       ├── EntryTable.tsx
│       ├── AdminCalendarEntryFormDialog.tsx
│       └── typeMeta.ts
└── src/entities/admin-calendar
    ├── api/adminCalendarApi.ts
    └── model
        ├── types.ts
        └── useAdminCalendar.ts

restaurant-book-server
└── src/main/java/com/cj/restaurantbook/admin_calendar
    ├── domain
    ├── infrastructure
    ├── application
    └── presentation
```

## BeautyBook과 다른 점

1. 테이블명은 RestaurantBook의 plural 컨벤션에 맞춰 `admin_calendar_entries`를 권장한다.
2. 메뉴는 사이드바가 아니라 `NavigationMenuSeeder`와 `Header.tsx` 메가메뉴에 붙인다.
3. RestaurantBook 프론트에는 BeautyBook의 `FormDialog` 공통 컴포넌트가 없으므로 기존 `SaleMenuFormDialog`, `PermissionFormDialog`처럼 직접 overlay modal 패턴을 쓴다.
4. 페이지 설명과 placeholder는 식당 운영 문맥으로 바꾼다.
5. 색상은 BeautyBook의 teal 고정이 아니라 RestaurantBook의 `primary`, `border`, `muted`, `background` 토큰을 따른다.
6. **`createdByName`/`updatedBy` 추가**: RestaurantBook의 `boards.author_id` + `boards.author_name` 패턴과 일관되게 denormalized 작성자 이름과 마지막 수정자 id를 함께 저장한다 ([01-backend-db-domain.md](./01-backend-db-domain.md)).
7. **시간대 합의**: `schedule_date`는 Asia/Seoul 캘린더 날짜로 해석한다는 점을 명문화 ([01-backend-db-domain.md](./01-backend-db-domain.md) 시간대 합의 섹션).

## 인접 도메인 평가

RestaurantBook 백엔드 도메인 20개를 검토한 결과 **`admin_calendar` 단일 패키지로 충분**하고 추가 도메인 신설은 불필요하다. 다만 인접 도메인의 부재/존재가 일정 기능의 향후 확장 방향을 정한다.

- **부재**: `business_hours`, `reservation`(시간 점유) → MVP의 비목표(자동 영업시간 변경, 단체예약 테이블 점유)와 정합.
- **존재**: `board`(작성자 패턴 정렬), `staff_call`(NOTICE 직원 푸시 후속 연결점), `manager`(매니저 노출 후속 진입점), `permission`(권한 기반 노출 후속 진입점), `navigation_menu`(메뉴 시드).

상세 표는 [01-backend-db-domain.md](./01-backend-db-domain.md)의 "인접 도메인 영향 평가" 섹션을 참고.

## 비목표

- 고객 화면에 일정 노출
- 휴무일에 키오스크 주문 차단
- 영업시간 관리 기능 (`HOLIDAY` ↔ 영업시간 자동 override는 `business_hours` 도메인 신설 후속)
- 테이블 예약 기능 (`EVENT` ↔ `restaurant_table` 시간 점유 연결은 `RESERVATION` 분리 후속)
- 캘린더 반복 일정
- 일정 알림 (`NOTICE` ↔ `staff_call` 또는 notification 도메인 연결은 후속)
- 파일 첨부
- 일정 검색

이 기능은 운영자가 내부적으로 확인하는 얇은 CRUD부터 안정적으로 붙인다.
