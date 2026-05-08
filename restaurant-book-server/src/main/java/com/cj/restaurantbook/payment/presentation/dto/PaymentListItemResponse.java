package com.cj.restaurantbook.payment.presentation.dto;

import com.cj.restaurantbook.payment.domain.Payment;
import com.cj.restaurantbook.payment.domain.PaymentMethod;
import com.cj.restaurantbook.payment.domain.PaymentStatus;

import java.time.Instant;

public record PaymentListItemResponse(
        Long id,
        Long orderId,
        String orderNo,
        String tableName,
        int amount,
        PaymentMethod method,
        PaymentStatus status,
        Instant paidAt,
        Instant refundedAt,
        Long handledBy,
        Long refundedBy
) {
    public static PaymentListItemResponse from(Payment payment) {
        return new PaymentListItemResponse(
                payment.getId(),
                payment.getOrder().getId(),
                payment.getOrder().getOrderNo(),
                payment.getOrder().getTableName(),
                payment.getAmount(),
                payment.getMethod(),
                payment.getStatus(),
                payment.getPaidAt(),
                payment.getRefundedAt(),
                payment.getHandledBy(),
                payment.getRefundedBy()
        );
    }
}
