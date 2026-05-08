# 01. 백엔드 조회 모델 점검/보강 계획

## 방향

백엔드는 새 도메인을 만들지 않고 현재 `payment` 패키지 안에서 읽기 모델을 유지한다.

현재 필요한 파일은 대부분 구현되어 있으므로, 실제 작업은 **검증 + 작은 보강** 중심이다.

## 1. Payment

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/domain/Payment.java`

현재 역할:

- 결제 금액, 결제수단, 결제 상태 저장
- `paidAt`, `handledBy` 저장
- 환불 시 `REFUNDED`, `refundedAt`, `refundedBy` 저장

계획:

- 새 필드 추가 없음.
- `refund()`가 `PAID -> REFUNDED`만 허용하는지 유지한다.
- 부분 환불이 없으므로 환불 금액은 `amount` 전체로 계산한다.

완료 기준:

- 결제 완료된 주문만 환불 가능하다.
- `PaymentStatus.REFUNDED` 상태의 결제는 `refundedAt`이 반드시 존재한다.
- 환불된 결제는 매출 집계의 `PAID` 합계에서 빠지고, 환불 집계에만 잡힌다.

## 2. PaymentRepository

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/infrastructure/PaymentRepository.java`

현재 역할:

- `paidAt` 기간 기준 `PAID` 결제 조회
- `refundedAt` 기간 기준 `REFUNDED` 결제 조회

계획:

- 현재 쿼리 유지.
- 종료일은 exclusive로 유지한다.
- `join fetch p.order`를 유지해 목록 응답 생성 시 주문 정보 접근 비용을 줄인다.

점검할 내용:

- `findByStatusAndPaidAtRangeWithOrder()` 정렬이 `paidAt desc, id desc`인지 확인.
- `findByStatusAndRefundedAtRangeWithOrder()` 정렬이 `refundedAt desc, id desc`인지 확인.
- 환불 조회는 `paidAt`이 아니라 반드시 `refundedAt`을 사용한다.

## 3. SalesService

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/application/SalesService.java`

현재 역할:

- 오늘 요약 조회
- 기간별 상세 조회
- 결제수단별 집계
- 최근 결제/환불 목록 50건 반환

계획:

- 새 서비스 분리 없음.
- `BUSINESS_ZONE = Asia/Seoul` 기준 유지.
- `startDate > endDate` 입력 시 현재처럼 endDate로 보정할지, 400 오류로 바꿀지 결정한다.
- 결제/환불 목록은 MVP에서 각각 최근 50건으로 제한한다.
- 결제수단별 요약은 `PaymentMethod.values()` 기준으로 `CARD/CASH/ETC` 3개를 항상 반환한다.

권장:

- MVP에서는 현재 보정 로직 유지.
- 화면에서 시작일이 종료일보다 커지지 않게 막아 사용자 혼란을 줄인다.
- 서버 테스트에서는 보정 동작을 명시적으로 검증한다.

추가 검토:

- `netAmount`는 응답에 추가하지 않고 프론트에서 `totalAmount - refundAmount`로 계산해도 충분하다.
- 여러 화면에서 순매출을 공통으로 쓰게 되면 `SalesSummaryResponse`에 `netAmount`를 추가한다.
- 목록 페이징이 필요해지면 `GET /api/sales/payments`, `GET /api/sales/refunds`처럼 목록 API를 분리하고 cursor 기반으로 확장한다.

## 4. SalesController

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/SalesController.java`

현재 역할:

- `GET /api/sales/today-summary`
- `GET /api/sales?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd`
- `ADMIN`, `MANAGER` 접근 제한

계획:

- 엔드포인트 추가 없음.
- 프론트 UI 개편은 기존 API만 사용한다.
- Swagger 설명에 기간 기준과 환불 기준을 더 적어도 된다.

## 5. SalesSummaryResponse

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/SalesSummaryResponse.java`

현재 필드:

- `totalAmount`
- `paymentCount`
- `refundAmount`
- `refundCount`
- `methodSummaries`

계획:

- 현재 필드 유지.
- 순매출은 프론트 계산.
- 오늘 매니저 카드에서 환불 정보를 보여줄 수 있도록 `refundAmount/refundCount`는 유지한다.

## 6. SalesResponse

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/SalesResponse.java`

현재 필드:

- 기간
- 요약 필드
- 결제수단별 요약
- 최근 결제 목록
- 최근 환불 목록

계획:

- 현재 계약 유지.
- 화면에서 결제 목록과 환불 목록을 각각 독립 테이블로 렌더링한다.
- `recentPayments`, `refundedPayments`는 각각 최근 50건만 포함한다.
- 전체 건수는 `paymentCount`, `refundCount`로 확인한다. 목록 길이를 전체 건수처럼 사용하지 않는다.

## 7. PaymentListItemResponse

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/PaymentListItemResponse.java`

현재 필드:

- 주문 식별 정보
- 테이블명
- 금액
- 결제수단
- 상태
- `paidAt`
- `refundedAt`
- `handledBy`
- `refundedBy`

계획:

- 현재 필드 유지.
- `REFUNDED` 응답의 `refundedAt`은 반드시 존재해야 한다.
- 프론트 환불 목록에서 `refundedAt ?? paidAt` fallback은 사용하지 않는다.
- 만약 `REFUNDED`인데 `refundedAt`이 null이면 데이터 오류로 보고 서버 테스트에서 잡는다.

## 8. 테스트 계획

필수 추가 파일:

- `restaurant-book-server/src/test/java/com/cj/restaurantbook/payment/application/SalesServiceTest.java`

추가 선택 파일:

- `restaurant-book-server/src/test/java/com/cj/restaurantbook/payment/infrastructure/PaymentRepositoryTest.java`
- `restaurant-book-server/src/test/java/com/cj/restaurantbook/payment/presentation/SalesControllerTest.java`

검증 항목:

- 오늘 요약에 `PAID` 결제 합계가 잡힌다.
- `REFUNDED` 결제는 총 매출에서 제외되고 환불 금액에 포함된다.
- 환불 집계는 `refundedAt` 기준이다.
- 결제수단별 매출은 `PAID`만 포함한다.
- 결제수단별 요약은 결제가 없는 수단도 0원/0건으로 반환한다.
- 최근 목록은 최신순이며 최대 50건이다.
- `REFUNDED` 결제 응답의 `refundedAt`은 null이 아니다.
- 시작일이 종료일보다 뒤인 경우 현재 정책대로 보정된다.
- `ROLE_ADMIN`, `ROLE_MANAGER`가 아니면 `/api/sales`, `/api/sales/today-summary` 모두 403이다.
