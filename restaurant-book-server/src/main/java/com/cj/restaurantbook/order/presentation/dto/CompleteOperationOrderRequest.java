package com.cj.restaurantbook.order.presentation.dto;

import com.cj.restaurantbook.payment.domain.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public record CompleteOperationOrderRequest(
        @NotNull
        PaymentMethod paymentMethod
) {
}
