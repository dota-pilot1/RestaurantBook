package com.cj.restaurantbook.order.presentation;

import com.cj.restaurantbook.order.application.KitchenOrderService;
import com.cj.restaurantbook.order.presentation.dto.OperationCancelOrderRequest;
import com.cj.restaurantbook.order.presentation.dto.OrderResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/kitchen/orders")
@PreAuthorize("hasAnyRole('ADMIN', 'KITCHEN')")
@Tag(name = "Kitchen Orders", description = "주방 주문 상태 관리")
public class KitchenOrderController {

    private final KitchenOrderService kitchenOrderService;

    @GetMapping
    @Operation(summary = "주방 주문 목록 조회")
    public List<OrderResponse> list() {
        return kitchenOrderService.findKitchenOrders();
    }

    @GetMapping("/canceled")
    @Operation(summary = "최근 취소 주문 목록 조회")
    public List<OrderResponse> canceled() {
        return kitchenOrderService.findRecentCanceledOrders();
    }

    @PatchMapping("/{orderId}/accept")
    @Operation(summary = "주문 접수: RECEIVED -> ACCEPTED")
    public OrderResponse accept(@PathVariable Long orderId) {
        return kitchenOrderService.accept(orderId);
    }

    @PatchMapping("/{orderId}/start-cooking")
    @Operation(summary = "조리 시작: ACCEPTED -> COOKING")
    public OrderResponse startCooking(@PathVariable Long orderId) {
        return kitchenOrderService.startCooking(orderId);
    }

    @PatchMapping("/{orderId}/ready")
    @Operation(summary = "조리 완료: ACCEPTED 또는 COOKING -> READY")
    public OrderResponse ready(@PathVariable Long orderId) {
        return kitchenOrderService.ready(orderId);
    }

    @PatchMapping("/{orderId}/cancel")
    @Operation(summary = "주방 주문 취소: COMPLETED 전 주문 -> CANCELED")
    public OrderResponse cancel(
            @PathVariable Long orderId,
            @Valid @RequestBody OperationCancelOrderRequest request
    ) {
        return kitchenOrderService.cancel(orderId, request.cancelMessage());
    }
}
