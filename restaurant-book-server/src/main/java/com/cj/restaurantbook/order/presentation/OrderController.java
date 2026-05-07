package com.cj.restaurantbook.order.presentation;

import com.cj.restaurantbook.order.application.OrderService;
import com.cj.restaurantbook.order.presentation.dto.CancelOrderRequest;
import com.cj.restaurantbook.order.presentation.dto.CreateOrderRequest;
import com.cj.restaurantbook.order.presentation.dto.OrderResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/customer/orders")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(@Valid @RequestBody CreateOrderRequest request) {
        return orderService.createCustomerOrder(request);
    }

    @GetMapping("/active")
    public List<OrderResponse> active(@RequestParam String tableName) {
        return orderService.findActiveCustomerOrders(tableName);
    }

    @PatchMapping("/{orderId}/cancel")
    public OrderResponse cancel(
            @PathVariable Long orderId,
            @Valid @RequestBody CancelOrderRequest request
    ) {
        return orderService.cancelCustomerOrder(orderId, request.tableName());
    }
}
