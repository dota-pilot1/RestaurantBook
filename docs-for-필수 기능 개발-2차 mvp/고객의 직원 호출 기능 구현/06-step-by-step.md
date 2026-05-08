# 06. 단계별 작업 순서 + 검증 체크리스트

작성일: 2026-05-08

## 권장 작업 순서

각 단계는 PR 단위로 끊어도 되고, 작은 기능이라 1-2 PR로 합쳐도 된다. 권장은 **Step 1-2까지 1차 PR**, **Step 3-5까지 2차 PR**.

### Step 1. 백엔드 도메인 + Repository

01-backend-domain.md

1. `staff_call/domain/StaffCallStatus.java` 생성
2. `staff_call/domain/StaffCallType.java` 생성
3. `staff_call/domain/StaffCall.java` 생성
4. `staff_call/infrastructure/StaffCallRepository.java` 생성
5. `staff_call/infrastructure/StaffCallSchemaMigrator.java` 생성
6. `common/exception/ErrorCode.java` 항목 추가

검증:
- `./gradlew build` (또는 `bootRun`) 성공.
- 앱 기동 시 `staff_calls` 테이블 자동 생성 (로컬 PostgreSQL 기준).
- 콘솔에 `Synchronized staff_calls_status_check constraint` 로그 출력.

### Step 2. 백엔드 API + WebSocket

02-backend-api.md

1. `websocket/AppWebSocketHandler.java` 토픽/권한/브로드캐스트 메서드 추가
2. `staff_call/application/StaffCallBroadcaster.java` 생성
3. `staff_call/presentation/dto/*.java` 생성 (3개)
4. `staff_call/application/StaffCallService.java` 생성
5. `staff_call/presentation/CustomerStaffCallController.java` 생성
6. `staff_call/presentation/OperationsStaffCallController.java` 생성
7. `manager/application/ManagerDashboardService.java` 의존성/필드 추가
8. `manager/presentation/dto/ManagerDashboardResponse.java` 필드 추가

검증 (수동):
- Swagger UI에서 `Customer Staff Calls` / `Operations Staff Calls` 그룹 확인.
- `curl` 또는 Postman으로
  - `POST /api/customer/staff-calls` → 201 + 페이로드
  - `GET /api/customer/staff-calls/active?tableName=1번 테이블` → 1건
  - `GET /api/operations/staff-calls` (인증) → 1건
  - `PATCH /api/operations/staff-calls/{id}/acknowledge` (인증) → 200, 다음 GET은 0건
- 1분 내 같은 테이블 재호출 → 409 + `STAFF_CALL_003`
- 미인증으로 `/api/operations/staff-calls` → 401/403
- WebSocket: 인증된 STAFF로 `staff-calls:operations` 구독 가능, 익명으로는 거부.
- `GET /api/manager/dashboard` 응답에 `pendingStaffCallCount` 필드 존재.

### Step 3. 프론트 entities (공통 자산)

03-frontend-customer.md §1-§3 / 04-frontend-staff.md (공유)

1. `entities/staff-call/model/types.ts` 생성
2. `entities/staff-call/api/staffCallApi.ts` 생성
3. `entities/staff-call/api/staffCallRealtime.ts` 생성

검증:
- `npm run lint` / `tsc --noEmit` 또는 `npm run build` 통과.

### Step 4. 키오스크 (고객) UI

03-frontend-customer.md §4-§5

1. `features/kiosk/KioskHome.tsx` 수정
   - import / 상태 / 쿼리 / 뮤테이션 / WebSocket
   - 직원 호출 버튼 핸들러
   - 호출 진행 패널
   - 호출 다이얼로그
   - `StaffCallStatusItem` 헬퍼

검증 (브라우저):
- `/customer` 진입, 테이블 미설정 → 호출 버튼 클릭 시 토스트 안내.
- 테이블 설정 후 → 다이얼로그 → 유형 선택 → "호출하기".
- 사이드바에 "직원 호출 중" 패널 표시.
- 1분 내 재호출 시 토스트 / 안내.
- 호출 취소 → 패널 사라짐.

### Step 5. 직원 보드 UI

04-frontend-staff.md

1. `features/staff-ready-orders/StaffReadyOrders.tsx` 수정
   - import / 상태 / 쿼리 / 뮤테이션 / WebSocket / 사운드
   - 헤더 버튼
   - 호출 다이얼로그
   - `StaffCallRow` 헬퍼
   - `staffCallTypeLabel` 상수

검증 (브라우저, 두 창):
- 창 A: `/customer` (1번 테이블), 창 B: `/staff` 로그인.
- A에서 호출 → B에 사운드 + 토스트 + `호출(1)` 버튼.
- B에서 다이얼로그 열어 "확인" → A에서 패널 사라지고 토스트 / B에서 호출 카운트 0.

### Step 6. 매니저 대시보드

05-frontend-manager.md

1. `entities/manager/model/types.ts` 필드 추가
2. `app/manager/page.tsx` import / WebSocket / 카드 추가

검증:
- `/manager` 진입.
- A에서 호출 → 매니저 카드의 카운트 +1, 빨간 배경.
- 직원이 acknowledge → 카운트 0, 일반 배경.

## 회귀 테스트 체크리스트

기존 흐름이 깨지지 않았는지 확인.

- 일반 주문 생성/취소 흐름 정상 (`/customer` 주문 → `/staff` 보드).
- 운영 주문 보드의 `취소(N)` 알림 여전히 동작.
- 키친 보드에서는 `staff-calls:operations` 구독 시도 시 토픽 거부 (혹은 코드상 구독 안 함).
- 매니저 대시보드의 기존 카드/카드값 변동 없음.
- WebSocket 재연결 시나리오 (브라우저 슬립 → 깨움) 정상.

## 잠재 리스크 & 완화

| 리스크 | 완화 |
|--------|------|
| 동일 테이블 동시에 여러 키오스크에서 호출 | 서버 1분 중복 검사. 추가로 클라이언트에서 호출 중일 때 버튼 비활성화 |
| 키오스크 토스트 알림이 시끄러움 | MVP는 사운드 없이 시각적 알림만. 직원 보드에서만 사운드 재생 |
| `pendingStaffCallCount`가 영구 누적 | acknowledge가 호출되지 않으면 누적되므로 운영 SOP 필요. 자동 만료(예: 1시간)는 후속 PR |
| WebSocket 끊김 | 기존 `useAppWebSocketTopic`의 자동 재연결 + `refetchInterval` 폴링 fallback |
| 익명 사용자가 다른 테이블 호출 취소 시도 | 서버에서 `tableName` 일치 검증 (`STAFF_CALL_TABLE_MISMATCH`) |
| 메시지에 욕설/과장 | MVP 스코프 외. 후속에 신고 기능 추가 가능 |

## 후속 개선 (Out of Scope)

- 호출 자동 만료 (예: 30분 PENDING → AUTO_CANCELED)
- 호출 응대 시간 통계 (`acknowledgedAt - createdAt`)
- "응대 중" 별도 상태 (PENDING → IN_PROGRESS → ACKNOWLEDGED)
- site-settings에서 호출 유형 라벨 외부화 / 다국어
- `/screen-settings`의 "직원 호출 문구" 항목과 연동
- 모바일 푸시/SMS 알림 (영업 시간 외 매니저 알림)
- 호출 처리 직원 평가/순번 배정

## 산출물 트리 (예상)

```
restaurant-book-server/src/main/java/com/cj/restaurantbook/staff_call/
├── application/
│   ├── StaffCallBroadcaster.java
│   └── StaffCallService.java
├── domain/
│   ├── StaffCall.java
│   ├── StaffCallStatus.java
│   └── StaffCallType.java
├── infrastructure/
│   ├── StaffCallRepository.java
│   └── StaffCallSchemaMigrator.java
└── presentation/
    ├── CustomerStaffCallController.java
    ├── OperationsStaffCallController.java
    └── dto/
        ├── CancelStaffCallRequest.java
        ├── CreateStaffCallRequest.java
        └── StaffCallResponse.java

restaurant-book-front/src/entities/staff-call/
├── api/
│   ├── staffCallApi.ts
│   └── staffCallRealtime.ts
└── model/
    └── types.ts
```

수정 대상:
- `websocket/AppWebSocketHandler.java`
- `common/exception/ErrorCode.java`
- `manager/application/ManagerDashboardService.java`
- `manager/presentation/dto/ManagerDashboardResponse.java`
- `entities/manager/model/types.ts`
- `features/kiosk/KioskHome.tsx`
- `features/staff-ready-orders/StaffReadyOrders.tsx`
- `app/manager/page.tsx`

## 완료 기준 (전체)

- 고객이 호출 → 직원 보드에 실시간 알림.
- 직원이 acknowledge → 고객 화면 / 매니저 대시보드 즉시 갱신.
- 1분 내 중복 호출 차단.
- 비인증 사용자가 운영 API/WebSocket 접근 차단.
- 회귀 없음 (주문/취소/환불/매니저 대시보드 정상).
