# 매출 통계 페이지 구현 계획 for 매니저 페이지

작성일: 2026-05-08

## 결론

지금 단계에서는 **매출 통계부터 구현하는 것이 적절하다.**

주문 생성, 조리/직원 보드, 결제 완료, 환불 기록까지 연결된 상태라서 매니저가 하루 운영 결과를 확인하는 읽기 화면을 붙이기에 좋은 시점이다. 새 주문/결제 기능을 더 늘리기 전에 매출 조회 기준을 고정하면 이후 환불, 매출 리포트, 정산 기능의 기준점도 흔들리지 않는다.

## 도메인 확장 여부

이번 MVP에서는 **새 도메인 확장이 필요 없다.**

매출 통계는 별도 `Sales` 엔티티를 만들지 않고 기존 `Payment`를 기준으로 계산한다. `SalesService`는 조회 전용 애플리케이션 서비스로 두고, 화면에서 필요한 값은 결제/환불 기록을 집계해서 내려준다.

추가 테이블이나 도메인이 필요한 시점은 아래 단계부터다.

- 일별 마감 금액을 스냅샷으로 잠가야 할 때
- PG 정산 금액과 현장 매출을 대조해야 할 때
- 세금, 할인, 봉사료, 쿠폰, 부분 환불을 정식 정산 도메인으로 다룰 때
- 월간/연간 리포트 성능 때문에 사전 집계 테이블이 필요할 때

## 현재 코드 기준 판단

백엔드의 핵심 계약은 이미 `payment` 도메인 안에 있다.

- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/application/SalesService.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/SalesController.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/SalesResponse.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/SalesSummaryResponse.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/PaymentListItemResponse.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/infrastructure/PaymentRepository.java`

프론트도 기본 매출 상세 화면은 있다.

- `restaurant-book-front/src/entities/payment/model/types.ts`
- `restaurant-book-front/src/entities/payment/api/paymentApi.ts`
- `restaurant-book-front/src/app/sales/page.tsx`
- `restaurant-book-front/src/app/manager/page.tsx`

따라서 이번 작업의 핵심은 도메인 추가가 아니라 **매출 화면을 매니저가 실제로 운영 중 반복해서 볼 수 있는 통계 UI로 다듬고, 기존 API 계약을 검증하는 것**이다.

## 보강된 MVP 결정

- 최근 결제/환불 목록은 각각 최근 50건만 표시하고, 화면에 `최근 50건` 제한을 명시한다.
- `REFUNDED` 결제는 `refundedAt`이 반드시 있어야 하며, 환불 목록에서 `paidAt` fallback은 사용하지 않는다.
- 결제수단별 요약은 백엔드가 `CARD/CASH/ETC` 3개를 항상 0원/0건 포함해서 반환한다.
- 순매출은 실제로 음수가 될 수 있으므로 음수 부호와 경고 색상으로 그대로 표시한다.
- `SalesServiceTest`는 필수로 추가해 `refundedAt` 기준 환불 집계, 50건 제한, 결제수단 3개 반환을 잠근다.
- `/api/sales`, `/api/sales/today-summary` 권한 회귀는 비매니저 403 테스트로 확인한다.

## 문서 구성

| 문서 | 내용 |
|------|------|
| [00-overview.md](./00-overview.md) | 범위, 화면 목표, 집계 기준 |
| [01-backend-read-model.md](./01-backend-read-model.md) | 백엔드 파일별 점검/보강 계획 |
| [02-frontend-sales-page.md](./02-frontend-sales-page.md) | `/sales` 페이지 UI 재구성 계획 |
| [03-manager-dashboard-entry.md](./03-manager-dashboard-entry.md) | 매니저 대시보드와 매출 통계 연결 계획 |
| [04-step-by-step.md](./04-step-by-step.md) | 단계별 작업 순서와 검증 체크리스트 |
