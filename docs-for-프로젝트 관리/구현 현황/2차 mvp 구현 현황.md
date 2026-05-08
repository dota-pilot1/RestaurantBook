# RestaurantBook 2차 MVP 구현 현황

작성일: 2026-05-08

## 기준

최근 커밋:

| 커밋 | 내용 |
| --- | --- |
| `711d240` | 테이블 관리 기능 추가 |
| `cb2f0f0` | 1차 MVP 운영 흐름 완료 |
| `c110c82` | 후불 테이블 키오스크 주문 구현 |
| `94c769d` | 고객 주문 생성 MVP 구현 |

참고 문서:

| 문서 | 내용 |
| --- | --- |
| `docs-for-필수 기능 개발-2차 mvp/결제 취소 및 환불 도메인 개발` | 환불 도메인/API/매출/프론트 계획 |
| `docs-for-필수 기능 개발-2차 mvp/판매 메뉴 선택시 카드 우상단에 체크 마크 출력.md` | 키오스크 선택 UX 개선 |
| `docs-for-필수 기능 개발-2차 mvp/조리가 불필요한 판매 메뉴에 대해 접수 받았을 경우 바로 준비 완료 처리/처리 방식.md` | 조리 불필요 메뉴 자동 READY 처리 |

## 1. 완료 체크리스트

### 1.1 테이블 관리 기반

- [x] `RestaurantTable` 도메인 추가
- [x] 테이블 관리 API 추가
- [x] 테이블 관리 프론트 페이지 추가
- [x] 관리자 대시보드에서 테이블 관리 진입 연결
- [x] `RestaurantTableSeeder`로 기본 테이블 initializer 추가
- [x] 최근 커밋 `711d240`에 반영

관련 파일:

- `restaurant-book-server/src/main/java/com/cj/restaurantbook/restaurant_table`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/config/RestaurantTableSeeder.java`
- `restaurant-book-front/src/features/table-management`
- `restaurant-book-front/src/app/tables/page.tsx`

### 1.2 키오스크 메뉴 선택 UX

- [x] 메뉴 선택 시 카드 우상단 체크 배지 표시
- [x] 수량이 1개 이상일 때만 선택 표시
- [x] 수량이 0으로 돌아오면 선택 표시 제거
- [x] 카드 `overflow-hidden`에 잘리지 않도록 래퍼 기준으로 배치

관련 파일:

- `restaurant-book-front/src/features/kiosk/KioskHome.tsx`

### 1.3 조리 불필요 메뉴 자동 준비 완료

- [x] `sale_menus.requires_cooking` 컬럼 추가
- [x] `order_items.requires_cooking` 스냅샷 컬럼 추가
- [x] 메뉴 생성/수정 API에 `requiresCooking` 필드 추가
- [x] 메뉴 관리 등록/수정 폼에 `조리 필요` 토글 추가
- [x] 메뉴 목록에 `조리` 빠른 토글 추가
- [x] 주문 생성 시 메뉴의 조리 필요 여부를 주문 아이템에 스냅샷 저장
- [x] 세트 메뉴는 구성 메뉴 중 하나라도 조리 필요이면 조리 필요로 판단
- [x] 주방에서 `주문 접수` 시 모든 아이템이 조리 불필요이면 바로 `READY` 처리
- [x] `SaleMenuSeeder` initializer 데이터에 조리 필요 여부 반영
- [x] 기존 seed 메뉴 update 시에도 `requiresCooking` 값 재보정
- [x] 콜라 단일 주문이 직원 보드의 `조리 완료` 컬럼으로 이동하는 것 확인

Initializer 기준:

| 카테고리 | 메뉴 | 조리 필요 |
| --- | --- | --- |
| 식사 | 육회 비빔밥, 제육 덮밥, 불고기 덮밥 | true |
| 국/찌개 | 김치 찌개, 된장 찌개, 소고기 미역국 | true |
| 면/분식 | 잔치 국수, 떡볶이 | true |
| 사이드 | 해물 파전, 김치전, 고기 만두, 오늘의 반찬 | true |
| 음료 | 식혜, 수정과, 콜라 | false |

관련 파일:

- `restaurant-book-server/src/main/java/com/cj/restaurantbook/sale_menu/domain/SaleMenu.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/order/domain/OrderItem.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/order/domain/Order.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/order/application/KitchenOrderService.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/sale_menu_set/domain/SaleMenuSet.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/config/SaleMenuSeeder.java`
- `restaurant-book-front/src/features/sale-menu-management/SaleMenuFormDialog.tsx`
- `restaurant-book-front/src/features/sale-menu-management/SaleMenuTable.tsx`

### 1.4 결제 취소 및 환불 도메인

- [x] `Payment`에 환불 상태 전이 추가
- [x] `PaymentStatus.REFUNDED` 기준 환불 처리
- [x] 환불 시각 `refundedAt` 기록
- [x] 환불 처리자 `refundedBy` 기록
- [x] `Order.refund()`로 `COMPLETED -> CANCELED` 전이
- [x] 운영 주문 서비스에서 주문/결제를 하나의 트랜잭션으로 환불 처리
- [x] 운영 환불 API 추가
- [x] 직원 주문 보드에서 결제 완료 주문에 환불 버튼 추가
- [x] 환불 확인 다이얼로그 추가

관련 API:

- `PATCH /api/operations/orders/{orderId}/refund`

관련 파일:

- `restaurant-book-server/src/main/java/com/cj/restaurantbook/order/application/OperationsOrderService.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/order/presentation/OperationsOrderController.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/order/domain/Order.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/domain/Payment.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/infrastructure/PaymentRepository.java`
- `restaurant-book-front/src/features/staff-ready-orders/StaffReadyOrders.tsx`

### 1.5 매출 환불 집계

- [x] `GET /api/sales` 응답에 환불 금액 추가
- [x] `GET /api/sales` 응답에 환불 건수 추가
- [x] `GET /api/sales` 응답에 환불 목록 추가
- [x] 매출 합계는 `PAID` 결제 기준으로 유지
- [x] 환불 집계는 `refundedAt` 기준으로 분리
- [x] 매출 화면에 환불 금액/건수/목록 표시

관련 파일:

- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/application/SalesService.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/SalesResponse.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/SalesSummaryResponse.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/PaymentListItemResponse.java`
- `restaurant-book-front/src/app/sales/page.tsx`

### 1.6 검증 완료

- [x] 백엔드 `./gradlew test`
- [x] 프론트 `npm run lint`
- [x] 로컬 DB `sale_menus.requires_cooking` 컬럼 생성 확인
- [x] 로컬 DB `order_items.requires_cooking` 컬럼 생성 확인
- [x] 로컬 DB 음료 메뉴 `requires_cooking=false` 확인
- [x] 콜라 주문 자동 `READY` 이동 수동 확인
- [x] 콜라 결제 완료 후 환불 처리 확인
- [x] 콜라 환불이 매출 페이지 환불 목록에 반영됨 확인
- [x] 환불 금액/환불 건수 집계 반영 확인

## 2. 해야 할 일 추천

### P0. 환불 기능 추가 검증

콜라 환불 성공과 매출 반영은 확인 완료. 실패/중복 케이스만 추가 확인하면 된다.

- [x] 결제 완료 주문 환불 성공 확인
- [x] 환불 성공 후 직원 보드 갱신 확인
- [x] 환불 성공 후 매출 화면 반영 확인
- [x] 최근 환불 목록에 주문번호/테이블/결제수단/환불금액 표시 확인
- [ ] DB에서 환불 후 주문 상태가 `CANCELED`로 바뀌는지 확인
- [ ] DB에서 환불 후 결제 상태가 `REFUNDED`로 바뀌는지 확인
- [ ] DB에서 `refundedAt`, `refundedBy` 기록 확인
- [ ] 같은 주문 중복 환불 시 실패 확인
- [ ] 결제 정보 없는 주문 환불 실패 확인
- [ ] 결제 완료 전 주문 환불 실패 확인

### P0. 매출 환불 집계 추가 검증

- [x] `refundAmount`, `refundCount`, `refundedPayments`가 환불 데이터와 일치하는지 확인
- [x] 환불 목록 정렬 확인
- [x] `#3040` 콜라 환불 `-2,500원` 표시 확인
- [x] 기존 `#7775 -6,500원`과 합산되어 환불 금액 `9,000원`, 환불 건수 `2건` 표시 확인
- [ ] 기간 필터에서 결제 집계는 `paidAt` 기준인지 확인
- [ ] 기간 필터에서 환불 집계는 `refundedAt` 기준인지 확인
- [ ] `totalAmount`, `paymentCount`, `methodSummaries`가 `PAID` 결제만 기준으로 유지되는지 확인
- [ ] 환불 목록 빈 상태 UI 확인

### P1. 조리 불필요 주문 회귀 검증

콜라 단일 주문은 확인 완료. 혼합 주문과 세트 메뉴 케이스를 추가 확인한다.

- [ ] 조리 필요 메뉴 단일 주문은 `ACCEPTED`로 이동
- [ ] 조리 불필요 메뉴 단일 주문은 `READY`로 이동
- [ ] 조리 필요 + 조리 불필요 혼합 주문은 `ACCEPTED`로 이동
- [ ] 조리 불필요 메뉴만으로 구성된 세트는 `READY`로 이동
- [ ] 조리 필요 메뉴가 하나라도 포함된 세트는 `ACCEPTED`로 이동
- [ ] 메뉴 설정 변경 후 기존 주문의 `order_items.requires_cooking` 스냅샷이 바뀌지 않는지 확인

### P1. 프론트 빌드 검증

- [ ] `cd restaurant-book-front && npm run build`

현재 확인된 프론트 자동 검증은 `npm run lint`까지다. 배포 전에는 Next build까지 확인하는 것이 좋다.

### P1. 자동 테스트 추가

현재 핵심 흐름은 수동 검증 비중이 높다. 이후 수정 리스크를 줄이려면 아래 테스트를 우선 추가한다.

- [ ] `Order.refund()` 도메인 테스트
- [ ] `Payment.refund()` 도메인 테스트
- [ ] `OperationsOrderService.refund()` 통합 테스트
- [ ] `SalesService` 환불 집계 테스트
- [ ] `KitchenOrderService.accept()` 조리 불필요 주문 자동 READY 테스트
- [ ] `SaleMenuSet.requiresCooking()` 세트 구성 테스트

### P2. DB 마이그레이션 정리

현재 서버는 `spring.jpa.hibernate.ddl-auto: update`를 사용한다. 운영 DB 적용을 고려하면 SQL 또는 Flyway 도입 여부를 정해야 한다.

확인 필요한 컬럼:

```sql
alter table payments
    add column if not exists refunded_at timestamp,
    add column if not exists refunded_by bigint;

alter table sale_menus
    add column if not exists requires_cooking boolean not null default true;

alter table order_items
    add column if not exists requires_cooking boolean not null default true;
```

### P2. UX 점검

- [ ] 직원 보드 환불 실패 토스트 문구 확인
- [ ] 환불 확인 다이얼로그 문구 확인
- [ ] 매출 화면 환불 목록 모바일/좁은 화면 확인
- [ ] 메뉴 관리 `조리` 토글이 운영자가 이해하기 쉬운지 확인
- [ ] 키오스크 체크 배지가 실제 태블릿 해상도에서 잘 보이는지 확인

## 현재 판단

2차 MVP의 핵심 비즈니스 흐름은 완료로 판단한다.

완료 처리 가능한 항목:

- 테이블 관리 기반
- 키오스크 선택 체크 배지
- 조리 불필요 메뉴 자동 준비 완료
- 결제 취소/환불 도메인 기본 흐름
- 매출 환불 집계 기본 흐름

후속 보강으로 남길 항목:

- 환불 실패/중복 케이스 검증
- 기간 필터 경계 검증
- 프론트 build 검증
- 자동 테스트 추가
- 운영 DB 마이그레이션 정리

추천 순서는 `실패/중복 환불 검증 -> 기간 필터 검증 -> 프론트 build -> 자동 테스트 보강`이다.
