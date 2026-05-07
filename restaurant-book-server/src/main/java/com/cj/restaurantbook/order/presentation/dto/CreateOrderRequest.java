package com.cj.restaurantbook.order.presentation.dto;

import com.cj.restaurantbook.order.domain.OrderType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateOrderRequest(
        String tableName,
        @NotNull OrderType orderType,
        @NotEmpty List<@NotNull @Valid CreateOrderItemRequest> items
) {
}
