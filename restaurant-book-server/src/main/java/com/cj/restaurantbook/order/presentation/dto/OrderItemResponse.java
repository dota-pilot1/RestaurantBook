package com.cj.restaurantbook.order.presentation.dto;

import com.cj.restaurantbook.order.domain.OrderItem;
import com.cj.restaurantbook.order.domain.OrderItemType;

import java.util.Comparator;
import java.util.List;

public record OrderItemResponse(
        Long id,
        OrderItemType type,
        Long saleMenuId,
        Long saleMenuSetId,
        String name,
        int unitPrice,
        int quantity,
        int lineTotal,
        boolean requiresCooking,
        List<OrderItemComponentResponse> components
) {
    public static OrderItemResponse from(OrderItem item) {
        return new OrderItemResponse(
                item.getId(),
                item.getItemType(),
                item.getSaleMenuId(),
                item.getSaleMenuSetId(),
                item.getItemName(),
                item.getUnitPrice(),
                item.getQuantity(),
                item.getLineTotal(),
                item.isRequiresCooking(),
                item.getComponents().stream()
                        .sorted(Comparator.comparingInt(com.cj.restaurantbook.order.domain.OrderItemComponent::getDisplayOrder))
                        .map(OrderItemComponentResponse::from)
                        .toList()
        );
    }
}
