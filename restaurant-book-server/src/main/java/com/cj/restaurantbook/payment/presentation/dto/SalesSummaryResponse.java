package com.cj.restaurantbook.payment.presentation.dto;

import java.util.List;

public record SalesSummaryResponse(
        long totalAmount,
        long paymentCount,
        long refundAmount,
        long refundCount,
        List<PaymentMethodSummaryResponse> methodSummaries
) {
}
