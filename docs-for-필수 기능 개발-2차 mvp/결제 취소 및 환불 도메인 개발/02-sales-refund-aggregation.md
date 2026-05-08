# 02. 매출 환불 집계

## 목표

매출 조회 API가 결제 매출과 환불 금액을 함께 반환한다. 총 매출은 기존처럼 `PAID` 결제 합계로 유지하고, 환불은 별도 필드로 노출한다.

## 1. PaymentRepository

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/infrastructure/PaymentRepository.java`

환불 시각 기준 조회 쿼리를 추가한다. 기존 `paidAt` 조회와 동일하게 종료일은 exclusive로 처리한다.

```java
@Query("""
        select p
        from Payment p
        join fetch p.order o
        where p.status = :status
          and p.refundedAt >= :start
          and p.refundedAt < :end
        order by p.refundedAt desc, p.id desc
        """)
List<Payment> findByStatusAndRefundedAtRangeWithOrder(
        @Param("status") PaymentStatus status,
        @Param("start") Instant start,
        @Param("end") Instant end
);
```

## 2. SalesSummaryResponse

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/SalesSummaryResponse.java`

오늘 요약에서도 환불 금액/건수가 필요하면 아래 필드를 추가한다.

```java
long refundAmount,
long refundCount,
```

기존 프론트와의 호환이 중요하면 `SalesResponse`에만 먼저 추가하고 오늘 요약은 2차로 미룬다.

## 3. SalesResponse

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/SalesResponse.java`

기간 조회 응답에 환불 필드를 추가한다.

```java
long refundAmount,
long refundCount,
List<PaymentListItemResponse> refundedPayments
```

`cancelAmount`와 `refundAmount`를 동시에 두면 용어가 흐려진다. 이번 기능은 결제 후 처리이므로 API 필드는 `refundAmount/refundCount`로 통일하는 것을 권장한다. 화면 라벨만 필요하면 "취소/환불 금액"처럼 표현한다.

## 4. PaymentListItemResponse

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/PaymentListItemResponse.java`

환불 목록에서 결제 시각 대신 환불 시각을 보여주려면 필드명을 확장한다.

권장안:

```java
Instant paidAt,
Instant refundedAt,
Long handledBy,
Long refundedBy
```

프론트 영향 범위를 줄이고 싶다면 `paidAt`은 유지하고 `refundedAt/refundedBy`만 추가한다.

## 5. SalesService

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/application/SalesService.java`

`findSales()`에서 결제와 환불을 각각 조회한다.

```java
List<Payment> paidPayments = findPaidPayments(normalizedStart, normalizedEnd);
List<Payment> refundedPayments = findRefundedPayments(normalizedStart, normalizedEnd);

long refundAmount = refundedPayments.stream().mapToLong(Payment::getAmount).sum();
long refundCount = refundedPayments.size();
```

환불 목록은 최근 결제 목록처럼 50건으로 제한한다.

```java
List<PaymentListItemResponse> recentRefunds = refundedPayments.stream()
        .limit(50)
        .map(PaymentListItemResponse::from)
        .toList();
```

## 완료 기준

- 기간 조회 시 `PAID` 결제 합계와 `REFUNDED` 환불 합계가 분리되어 내려온다.
- 환불 집계는 `paidAt`이 아니라 `refundedAt` 기준이다.
- 기존 결제수단별 매출은 환불 결제를 포함하지 않는다.
- 프론트가 환불 금액, 환불 건수, 환불 목록을 타입 안정적으로 사용할 수 있다.

