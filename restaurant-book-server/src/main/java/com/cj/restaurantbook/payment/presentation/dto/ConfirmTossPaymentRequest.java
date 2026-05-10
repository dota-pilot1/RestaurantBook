package com.cj.restaurantbook.payment.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ConfirmTossPaymentRequest(
        @NotBlank String tossOrderId,
        @NotBlank String paymentKey,
        @NotNull @Positive Integer amount,
        @NotBlank String tableName,
        @Size(min = 1) List<@NotNull Long> restaurantOrderIds
) {
}
