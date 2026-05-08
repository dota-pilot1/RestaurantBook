# 00. 고객 직원 호출 기능 - 전체 개요

작성일: 2026-05-08

## 배경

KioskHome 우측 하단에 "직원 호출" 버튼이 placeholder로 존재하지만 동작하지 않는다.
(`restaurant-book-front/src/features/kiosk/KioskHome.tsx:731-737`)

기능 목표:

- 고객이 키오스크에서 직원을 호출하면 직원 보드에 실시간 알림이 뜬다.
- 직원이 처리하면 고객 화면에도 처리 완료 상태가 반영된다.
- 매니저 대시보드에는 미처리 호출 건수가 메트릭으로 보인다.

## 사용자 시나리오

1. 고객: `[직원 호출]` 버튼 → 다이얼로그 → (선택) 메시지 입력 → "호출하기"
2. 고객 화면: "호출 중" 배지 + 경과 시간 표시 (취소 가능)
3. 직원 화면: 우측 상단 `호출(N)` 빨간 버튼 깜빡임 → 클릭 시 호출 목록 다이얼로그
4. 직원: "확인" 또는 "처리 완료" 버튼 → 고객 화면 배지 사라지고 토스트 알림
5. 매니저 화면: 실시간 메트릭 카드에 "미처리 호출 N건" 표시

## 사용자 질문에 대한 답변

| 질문 | 결정 | 이유 |
|------|------|------|
| 직원 페이지에 취소처럼 버튼? | 같은 패턴 채택 (`Bell` + 카운터 + Dialog) | 기존 취소 알림 UX와 일관성. 학습 비용 0 |
| 다이얼로그 + 메시지 입력? | 그렇게 (옵션 카테고리 + 자유 메시지) | 이미 `ConfirmDialog`/`NoticeDialog` 패턴 존재 |
| 백엔드 도메인 확장 필요? | **필요. `staff_call` 신규 도메인** | Order에 우겨넣으면 책임 혼재 (Order는 메뉴 주문 흐름 전용) |
| 매니저에게도 알림 필요? | 메트릭/지표 수준만 | 매니저는 직접 응대하지 않음. 미처리 누적 모니터링 용도 |
| 단계별 계획 문서? | 6개 파일로 분할 | 결제 환불 도메인과 동일한 폴더 구조 채택 |

## 아키텍처 결정

### 1. 새 도메인 `staff_call`

기존 도메인과 분리한다.

```
restaurant-book-server/src/main/java/com/cj/restaurantbook/staff_call/
├── application/
│   ├── StaffCallService.java
│   └── StaffCallBroadcaster.java
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
        ├── CreateStaffCallRequest.java
        ├── StaffCallResponse.java
        └── ...
```

### 2. WebSocket 토픽

기존 토픽 컨벤션을 그대로 따른다 (`AppWebSocketHandler.java:24-25`).

| 토픽 | 구독자 | 이벤트 타입 |
|------|--------|--------------|
| `staff-calls:operations` | ADMIN / MANAGER / STAFF | `STAFF_CALL_LIST_CHANGED` |
| `customer:calls/{tableName}` | 익명(테이블 기반) | `CUSTOMER_CALLS_CHANGED` |

`AppWebSocketHandler`에 `staff-calls:operations` 토픽 검증을 추가하고 `customer:calls/` 프리픽스를 허용한다. 키친 롤은 호출 응대 책임이 없으므로 권한에서 제외한다.

> 매니저 대시보드는 새 토픽을 구독하지 않고 `staff-calls:operations`를 그대로 구독한다.
> 단순한 카운트 갱신이라 별도 토픽까지 분리하면 과설계.

### 3. 상태 머신

```
PENDING ──acknowledge──▶ ACKNOWLEDGED   (직원 확인. 종결 상태)
   │
   └────cancel─────────▶ CANCELED       (고객이 취소. 종결 상태)
```

- `acknowledged_at`, `acknowledged_by` 기록.
- 종결 후 30분 (또는 운영 정책)이 지나면 보드에서 자동 사라진다 → 백엔드 조회 시 `PENDING` 위주, 통계 외에는 `ACKNOWLEDGED`/`CANCELED`는 표시 안 함.

### 4. 인증/식별

- 고객 호출 API는 `application.yaml`의 보안 무인증 경로 (`/api/customer/**`) 패턴을 그대로 사용한다.
- 테이블 식별은 기존 `Order` 패턴과 동일 (`tableName` String).
- 운영 API는 기존 패턴(`@PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'MANAGER')")`).

## 파일 변경 요약

### 백엔드 신규

- `staff_call/domain/StaffCall.java`
- `staff_call/domain/StaffCallStatus.java`
- `staff_call/domain/StaffCallType.java`
- `staff_call/infrastructure/StaffCallRepository.java`
- `staff_call/infrastructure/StaffCallSchemaMigrator.java`
- `staff_call/application/StaffCallService.java`
- `staff_call/application/StaffCallBroadcaster.java`
- `staff_call/presentation/CustomerStaffCallController.java`
- `staff_call/presentation/OperationsStaffCallController.java`
- `staff_call/presentation/dto/*.java`

### 백엔드 수정

- `websocket/AppWebSocketHandler.java` (토픽 추가, broadcaster 메서드 추가)
- `common/exception/ErrorCode.java` (STAFF_CALL_* 에러 코드 추가)
- `manager/application/ManagerDashboardService.java` (`pendingStaffCallCount` 추가)
- `manager/presentation/dto/ManagerDashboardResponse.java`

### 프론트엔드 신규

- `entities/staff-call/api/staffCallApi.ts`
- `entities/staff-call/api/staffCallRealtime.ts`
- `entities/staff-call/model/types.ts`
- `features/kiosk/StaffCallPanel.tsx` (혹은 KioskHome에 통합)

### 프론트엔드 수정

- `features/kiosk/KioskHome.tsx` (직원 호출 버튼 활성화 + 호출 상태 패널)
- `features/staff-ready-orders/StaffReadyOrders.tsx` (호출 알림 버튼 + 다이얼로그)
- `app/manager/page.tsx` (미처리 호출 카드 추가)
- `entities/manager/model/types.ts` (`pendingStaffCallCount` 추가)

## 비기능 요구사항

- 동일 테이블에서 1분 내 중복 호출 방지 (서버에서 검증).
- 메시지 길이 200자 제한 (`@Size(max=200)`).
- 종결 호출 자동 정리: 응답 시 `ACKNOWLEDGED`/`CANCELED` 후 24시간 경과 건은 응답 목록에서 제외 (DB 삭제 X, 통계 보존).
- WebSocket 미연결 시에도 `refetchInterval: 5000` 폴링으로 fallback (Order 패턴 동일).

## 후속 단계 문서

| 파일 | 내용 |
|------|------|
| `01-backend-domain.md` | 엔티티, 상태 머신, Repository, 스키마 |
| `02-backend-api.md` | API 명세, Service, Broadcaster, WebSocket 토픽 |
| `03-frontend-customer.md` | KioskHome 직원 호출 버튼/다이얼로그/상태 패널 |
| `04-frontend-staff.md` | 직원 보드 호출 알림 버튼 + 처리 다이얼로그 |
| `05-frontend-manager.md` | 매니저 대시보드 미처리 호출 메트릭 |
| `06-step-by-step.md` | 단계별 작업 순서 + 검증 체크리스트 |
