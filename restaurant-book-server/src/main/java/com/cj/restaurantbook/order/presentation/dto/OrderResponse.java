package com.cj.restaurantbook.order.presentation.dto;

import com.cj.restaurantbook.order.domain.Order;
import com.cj.restaurantbook.order.domain.OrderStatus;
import com.cj.restaurantbook.order.domain.OrderType;
import com.cj.restaurantbook.payment.domain.Payment;
import com.cj.restaurantbook.payment.domain.PaymentMethod;

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
        PaymentMethod paymentMethod,
        String paymentProviderMethod,
        List<OrderItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {
    public static OrderResponse from(Order order) {
        return from(order, null);
    }

    public static OrderResponse from(Order order, Payment payment) {
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
                payment == null ? null : payment.getMethod(),
                payment == null ? null : payment.getProviderMethod(),
                order.getItems().stream()
                        .sorted(Comparator.comparingInt(com.cj.restaurantbook.order.domain.OrderItem::getDisplayOrder))
                        .map(OrderItemResponse::from)
                        .toList(),
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
