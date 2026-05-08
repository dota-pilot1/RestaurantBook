# 01. 백엔드 환불 도메인/API

## 목표

직원이 결제 완료 주문을 환불 처리하면 하나의 트랜잭션 안에서 주문과 결제 상태가 함께 바뀐다.

```text
PATCH /api/operations/orders/{orderId}/refund
  -> Order COMPLETED -> CANCELED
  -> Payment PAID -> REFUNDED
  -> refundedAt/refundedBy 기록
  -> 운영 주문 보드 WebSocket 전파
```

## 1. Order 도메인

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/order/domain/Order.java`

`cancel()`은 결제 전 운영 취소 흐름에 남겨두고, 결제 후 환불은 별도 메서드로 분리한다.

```java
public void refund() {
    if (this.status != OrderStatus.COMPLETED) {
        throw new IllegalStateException("결제 완료 상태에서만 환불할 수 있습니다.");
    }
    this.status = OrderStatus.CANCELED;
    this.cancelMessage = "환불 처리됨";
}
```

## 2. Payment 도메인

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/domain/Payment.java`

필드 추가:

```java
@Column(name = "refunded_at")
private Instant refundedAt;

@Column(name = "refunded_by")
private Long refundedBy;
```

메서드 추가:

```java
public void refund(Long handledBy) {
    if (this.status != PaymentStatus.PAID) {
        throw new IllegalStateException("PAID 상태에서만 환불할 수 있습니다.");
    }
    this.status = PaymentStatus.REFUNDED;
    this.refundedAt = Instant.now();
    this.refundedBy = handledBy;
}
```

## 3. DB 반영

현재 프로젝트에는 Flyway/Liquibase 마이그레이션 구조가 없다. 로컬 개발은 `ddl-auto: update`로 컬럼이 자동 반영된다.

운영 DB나 공유 DB에 직접 반영해야 하면 아래 SQL을 사용한다.

```sql
ALTER TABLE payments
    ADD COLUMN refunded_at TIMESTAMP,
    ADD COLUMN refunded_by BIGINT;
```

## 4. PaymentRepository

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/infrastructure/PaymentRepository.java`

환불 처리 시 주문 ID로 결제를 찾는다.

```java
Optional<Payment> findByOrderId(Long orderId);
```

동시 요청까지 방어하려면 비관적 락 쿼리를 우선 고려한다.

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
Optional<Payment> findForUpdateByOrderId(Long orderId);
```

## 5. ErrorCode

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/common/exception/ErrorCode.java`

최소 추가 권장:

```java
PAYMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "PAYMENT_002", "결제 정보를 찾을 수 없습니다."),
PAYMENT_REFUND_NOT_ALLOWED(HttpStatus.CONFLICT, "PAYMENT_003", "현재 결제 상태에서는 환불할 수 없습니다."),
```

## 6. OperationsOrderService

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/order/application/OperationsOrderService.java`

현재 결제 완료 처리가 이 서비스에 있으므로 MVP에서는 별도 `RefundService`보다 여기에 `refund()`를 추가하는 편이 작다. 환불 로직이 커지거나 PG 연동이 들어오면 `payment.application.RefundService`로 분리한다.

```java
@Transactional
public OrderResponse refund(Long orderId, Long handledBy) {
    Order order = orderRepository.findForUpdateById(orderId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
    Payment payment = paymentRepository.findForUpdateByOrderId(orderId)
            .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));

    try {
        order.refund();
        payment.refund(handledBy);
    } catch (IllegalStateException e) {
        throw new BusinessException(ErrorCode.PAYMENT_REFUND_NOT_ALLOWED);
    }

    orderBroadcaster.broadcastOrderChangedAfterCommit(
            "REFUNDED",
            order.getId(),
            order.getTableName(),
            order.getCancelMessage()
    );
    return OrderResponse.from(order);
}
```

## 7. OperationsOrderController

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/order/presentation/OperationsOrderController.java`

```java
@PatchMapping("/{orderId}/refund")
@Operation(summary = "결제 완료 주문 환불: COMPLETED -> CANCELED")
public OrderResponse refund(
        @PathVariable Long orderId,
        @AuthenticationPrincipal UserPrincipal principal
) {
    Long handledBy = principal == null ? null : principal.getId();
    return operationsOrderService.refund(orderId, handledBy);
}
```

## 완료 기준

- 결제 완료 주문만 환불된다.
- 이미 환불된 결제는 다시 환불되지 않는다.
- 주문 상태와 결제 상태가 같은 트랜잭션에서 변경된다.
- 환불 후 직원 주문 보드가 갱신된다.

