package com.cj.restaurantbook.payment.presentation.dto;

import java.time.LocalDate;
import java.util.List;

public record SalesResponse(
        LocalDate startDate,
        LocalDate endDate,
        long totalAmount,
        long paymentCount,
        long refundAmount,
        long refundCount,
        List<PaymentMethodSummaryResponse> methodSummaries,
        List<PaymentListItemResponse> recentPayments,
        List<PaymentListItemResponse> refundedPayments
) {
}
