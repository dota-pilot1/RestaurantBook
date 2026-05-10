package com.cj.restaurantbook.payment.presentation.dto;

import com.cj.restaurantbook.order.presentation.dto.OrderResponse;

import java.util.List;

public record ConfirmTossPaymentResponse(
        Long paymentId,
        int amount,
        List<OrderResponse> orders
) {
}
