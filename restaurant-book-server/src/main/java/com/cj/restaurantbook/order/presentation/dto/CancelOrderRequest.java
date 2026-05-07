package com.cj.restaurantbook.order.presentation.dto;

import jakarta.validation.constraints.NotBlank;

public record CancelOrderRequest(
        @NotBlank String tableName
) {
}
