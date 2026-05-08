# 04. 검증 체크리스트

## 백엔드 단위 검증

- [ ] `Order.refund()`는 `COMPLETED`에서만 성공한다.
- [ ] `Order.refund()` 성공 시 상태가 `CANCELED`가 되고 `cancelMessage`가 설정된다.
- [ ] `Payment.refund()`는 `PAID`에서만 성공한다.
- [ ] `Payment.refund()` 성공 시 상태가 `REFUNDED`가 되고 `refundedAt/refundedBy`가 설정된다.
- [ ] 이미 `REFUNDED`인 결제는 다시 환불되지 않는다.

## API 검증

- [ ] `PATCH /api/operations/orders/{orderId}/refund`가 `ROLE_ADMIN`, `ROLE_STAFF`에서만 호출된다.
- [ ] 결제 완료 주문 환불 시 `Order`와 `Payment`가 함께 변경된다.
- [ ] 결제 정보가 없는 주문 환불은 실패한다.
- [ ] 결제 완료 전 주문 환불은 실패한다.
- [ ] 중복 환불 요청은 실패한다.
- [ ] 환불 성공 후 WebSocket `ORDER_LIST_CHANGED`가 전파된다.

## 매출 검증

- [ ] `GET /api/sales` 응답에 `refundAmount/refundCount/refundedPayments`가 포함된다.
- [ ] 환불 집계는 `refundedAt` 기준 기간 필터를 사용한다.
- [ ] `totalAmount/paymentCount/methodSummaries`는 `PAID` 결제만 기준으로 유지된다.
- [ ] 환불 목록은 최근 환불순으로 정렬된다.

## 프론트 검증

- [ ] 직원 주문 보드에서 `COMPLETED` 주문에만 환불 버튼이 보인다.
- [ ] 환불 버튼 클릭 시 확인 절차가 있다.
- [ ] 환불 성공 후 보드 데이터가 갱신된다.
- [ ] 환불 실패 시 사용자에게 오류 토스트가 표시된다.
- [ ] 매출 화면의 환불 금액/건수가 실제 API 응답과 일치한다.
- [ ] 환불 목록이 비어 있을 때 빈 상태가 깨지지 않는다.

## 실행 명령

백엔드:

```bash
cd /Users/terecal/RestaurantBook/restaurant-book-server
./gradlew test
```

프론트엔드:

```bash
cd /Users/terecal/RestaurantBook/restaurant-book-front
npm run lint
npm run build
```

## 수동 시나리오

1. 고객 주문 생성
2. 주방에서 `ACCEPTED -> COOKING -> READY` 처리
3. 직원 보드에서 결제 완료 처리
4. 직원 보드의 결제 완료 주문에서 환불 처리
5. 주문 보드에서 주문 상태 변경 확인
6. 매출 화면에서 환불 금액/건수/목록 확인
7. 같은 주문으로 다시 환불 시도 후 실패 확인

