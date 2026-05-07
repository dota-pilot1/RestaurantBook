package com.cj.restaurantbook.order.presentation.dto;

import com.cj.restaurantbook.order.domain.OrderItemComponent;

public record OrderItemComponentResponse(
        String name,
        int quantity
) {
    public static OrderItemComponentResponse from(OrderItemComponent component) {
        return new OrderItemComponentResponse(
                component.getComponentName(),
                component.getQuantity()
        );
    }
}
