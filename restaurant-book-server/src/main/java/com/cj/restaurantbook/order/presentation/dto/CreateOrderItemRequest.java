package com.cj.restaurantbook.order.presentation.dto;

import com.cj.restaurantbook.order.domain.OrderItemType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateOrderItemRequest(
        @NotNull OrderItemType type,
        @NotNull Long id,
        @Min(1) int quantity
) {
}
