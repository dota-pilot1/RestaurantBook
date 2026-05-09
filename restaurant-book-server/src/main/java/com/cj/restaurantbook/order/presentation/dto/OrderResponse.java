package com.cj.restaurantbook.order.presentation.dto;

import com.cj.restaurantbook.order.domain.Order;
import com.cj.restaurantbook.order.domain.OrderStatus;
import com.cj.restaurantbook.order.domain.OrderType;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderNo,
        String tableName,
        OrderType orderType,
        OrderStatus status,
        int totalAmount,
        String cancelMessage,
        Instant kitchenCancelConfirmedAt,
        Instant kitchenCancelDismissedAt,
        List<OrderItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {
    public static OrderResponse from(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getOrderNo(),
                order.getTableName(),
                order.getOrderType(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getCancelMessage(),
                order.getKitchenCancelConfirmedAt(),
                order.getKitchenCancelDismissedAt(),
                order.getItems().stream()
                        .sorted(Comparator.comparingInt(com.cj.restaurantbook.order.domain.OrderItem::getDisplayOrder))
                        .map(OrderItemResponse::from)
                        .toList(),
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
