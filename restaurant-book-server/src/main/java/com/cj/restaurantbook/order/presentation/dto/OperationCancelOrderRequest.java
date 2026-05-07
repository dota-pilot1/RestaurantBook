package com.cj.restaurantbook.order.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OperationCancelOrderRequest(
        @NotBlank
        @Size(max = 500)
        String cancelMessage
) {
}
