package com.cj.restaurantbook.payment.presentation.dto;

import com.cj.restaurantbook.payment.domain.Payment;
import com.cj.restaurantbook.payment.domain.PaymentOrder;
import com.cj.restaurantbook.payment.domain.PaymentMethod;
import com.cj.restaurantbook.payment.domain.PaymentStatus;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

public record PaymentListItemResponse(
        Long id,
        Long orderId,
        String orderNo,
        String tableName,
        int amount,
        PaymentMethod method,
        String providerMethod,
        PaymentStatus status,
        Instant paidAt,
        Instant refundedAt,
        Long handledBy,
        Long refundedBy
) {
    public static PaymentListItemResponse from(Payment payment) {
        List<PaymentOrder> paymentOrders = payment.getPaymentOrders().stream()
                .sorted(Comparator.comparing(PaymentOrder::getId))
                .toList();
        PaymentOrder firstPaymentOrder = paymentOrders.isEmpty() ? null : paymentOrders.getFirst();
        String orderNo = paymentOrders.stream()
                .map(paymentOrder -> paymentOrder.getOrder().getOrderNo())
                .reduce((left, right) -> left + ", " + right)
                .orElse("-");
        String tableName = firstPaymentOrder == null ? null : firstPaymentOrder.getOrder().getTableName();
        return new PaymentListItemResponse(
                payment.getId(),
                firstPaymentOrder == null ? null : firstPaymentOrder.getOrder().getId(),
                orderNo,
                tableName,
                payment.getAmount(),
                payment.getMethod(),
                payment.getProviderMethod(),
                payment.getStatus(),
                payment.getPaidAt(),
                payment.getRefundedAt(),
                payment.getHandledBy(),
                payment.getRefundedBy()
        );
    }
}
