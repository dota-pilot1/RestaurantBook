# 01. 백엔드 결제 승인 구현

## 현재 결제 도메인 판단

현재 백엔드 결제 도메인은 시범 테스트 결제와 MVP 매출 집계에는 적절하다.

현재 구조:

- `Order` 1건에 `Payment` 1건이 연결된다.
- `payments.order_id`는 유니크 제약을 가진다.
- `Payment`는 `amount`, `method`, `status`, `paidAt`, `handledBy`, `refundedAt`, `refundedBy`를 가진다.
- 운영 결제 완료 API는 `Payment.paid(order, method, handledBy)`를 저장하고 `Order`를 `COMPLETED`로 전환한다.

이 구조로 가능한 것:

- 주문 1건 단위의 테스트 결제 승인
- 주문 완료 처리
- 기존 매출 요약 반영
- 기존 운영 환불 흐름 유지

이 구조에서 제한되는 것:

- 여러 `READY` 주문을 하나의 토스 결제로 묶는 합산 결제
- 토스 `paymentKey` 기반 결제 조회/취소/환불
- 토스 원본 결제수단 보존
- 영수증 URL, 승인 시각, PG 응답 추적

따라서 결제 실행은 `READY` 주문 묶음 단위와 선택 주문 결제를 모두 고려해서 `Payment`와 `Order`를 직접 1:1로 묶지 않는 방향이 장기적으로 맞다. 고객 모바일/키오스크 결제에서는 주문 금액을 쪼개는 분할 결제는 제외하되, 전체 결제와 선택 결제는 같은 테이블 구조로 처리한다.

정리:

- `Payment`: 실제 결제 1건
- `PaymentOrder`: 결제 1건에 포함된 주문 연결 정보
- `Order`: 기존 주문/조리 상태 정보
- 결제 후 기준으로 `Order` 1건은 `PaymentOrder` 1건과 1:1 매핑된다.
- `Payment` 1건은 여러 `PaymentOrder`를 가질 수 있다.
- 전체 결제는 `READY` 주문 전체를 `Payment` 1건에 연결한다.
- 선택 결제/각자 결제는 선택한 주문만 `Payment` 1건에 연결한다.

## 추가 파일

### `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/application/TossPaymentProperties.java`

역할:

- 토스 결제 설정을 `@ConfigurationProperties`로 바인딩한다.

필드:

- `clientKey`
- `secretKey`
- `apiBaseUrl`, 기본값 `https://api.tosspayments.com`

설정 prefix:

```yaml
toss-payments:
  client-key: ${TOSS_PAYMENTS_CLIENT_KEY:}
  secret-key: ${TOSS_PAYMENTS_SECRET_KEY:}
  api-base-url: ${TOSS_PAYMENTS_API_BASE_URL:https://api.tosspayments.com}
```

### `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/CustomerPaymentController.java`

역할:

- 고객 키오스크에서 사용할 결제 설정과 승인 API를 제공한다.

API:

```http
GET /api/customer/payments/config
POST /api/customer/payments/toss/confirm
```

`GET /config` 응답:

```json
{
  "clientKey": "test_ck_..."
}
```

`POST /toss/confirm` 요청:

```json
{
  "restaurantOrderId": 123,
  "tossOrderId": "rb-123-20260510010101",
  "paymentKey": "paymentKey_from_toss",
  "amount": 12000
}
```

응답:

```json
{
  "order": {
    "id": 123,
    "status": "COMPLETED"
  }
}
```

### `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/application/CustomerTossPaymentService.java`

역할:

- 결제 승인 전체 트랜잭션을 처리한다.

처리 순서:

1. `OrderRepository.findForUpdateById(restaurantOrderId)`로 주문 잠금 조회
2. 주문 상태가 `READY`인지 확인
3. `PaymentOrderRepository.existsByOrderId(orderId)` 또는 선택 주문 전체 검증으로 중복 결제 방지
4. 요청 `amount`와 선택 주문들의 `totalAmount` 합계 비교
5. 토스 승인 API `POST /v1/payments/confirm` 호출
6. 승인 응답 성공 시 `Payment` 1건 저장
7. 선택 주문 수만큼 `PaymentOrder` 저장
8. 선택 주문들을 모두 `Order COMPLETED`로 전환
9. `orderBroadcaster.broadcastOrderChangedAfterCommit("COMPLETED", ...)`를 주문 수만큼 호출
10. 결제 결과 응답 반환

주의:

- 토스 응답의 `method`가 카드가 아닐 수 있지만, 현재 결제 도메인의 `PaymentMethod`는 `CARD/CASH/ETC`만 있다. 테스트 결제 시범 범위에서는 온라인 결제를 `CARD`로 집계한다.
- 이후 토스 method를 보존하려면 `payments` 테이블에 `provider`, `providerPaymentKey`, `providerMethod` 컬럼을 추가한다.
- 주문 금액을 쪼개는 분할 결제는 제외한다. 따라서 `payment_orders.order_id`에 유니크 제약을 둬서 한 주문이 여러 결제에 중복 포함되지 않도록 한다.

### `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/TossPaymentConfigResponse.java`

필드:

- `clientKey`

### `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/ConfirmTossPaymentRequest.java`

필드:

- `Long restaurantOrderId`
- `String tossOrderId`
- `String paymentKey`
- `Integer amount`

검증:

- 모두 필수
- `amount`는 1 이상
- `tossOrderId`, `paymentKey`는 blank 금지

### `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/ConfirmTossPaymentResponse.java`

필드:

- `OrderResponse order`

## 수정 파일

### `restaurant-book-server/src/main/resources/application.yaml`

추가:

```yaml
toss-payments:
  client-key: ${TOSS_PAYMENTS_CLIENT_KEY:}
  secret-key: ${TOSS_PAYMENTS_SECRET_KEY:}
  api-base-url: ${TOSS_PAYMENTS_API_BASE_URL:https://api.tosspayments.com}
```

### `restaurant-book-server/src/main/java/com/cj/restaurantbook/config/SecurityConfig.java`

permitAll 추가:

```java
.requestMatchers(HttpMethod.GET, "/api/customer/payments/config").permitAll()
.requestMatchers(HttpMethod.POST, "/api/customer/payments/toss/confirm").permitAll()
```

### `restaurant-book-server/src/main/java/com/cj/restaurantbook/common/exception/ErrorCode.java`

추가 후보:

- `PAYMENT_PROVIDER_NOT_CONFIGURED`
- `PAYMENT_AMOUNT_MISMATCH`
- `PAYMENT_PROVIDER_CONFIRM_FAILED`

## 토스 승인 API 호출

요청:

```http
POST https://api.tosspayments.com/v1/payments/confirm
Authorization: Basic base64(TOSS_PAYMENTS_SECRET_KEY:)
Content-Type: application/json
```

body:

```json
{
  "paymentKey": "paymentKey_from_toss",
  "orderId": "rb-123-20260510010101",
  "amount": 12000
}
```

구현 방식:

- Spring `RestClient` 또는 `RestTemplate` 사용
- 네트워크 실패/4xx/5xx는 `PAYMENT_PROVIDER_CONFIRM_FAILED`로 매핑
- 로그에는 `paymentKey`, secret key 원문을 남기지 않는다.
