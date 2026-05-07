package com.cj.restaurantbook.payment.presentation.dto;

import com.cj.restaurantbook.payment.domain.PaymentMethod;

public record PaymentMethodSummaryResponse(
        PaymentMethod method,
        long amount,
        long count
) {
}
