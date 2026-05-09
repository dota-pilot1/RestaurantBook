package com.cj.restaurantbook.order.presentation;

import com.cj.restaurantbook.auth.security.UserPrincipal;
import com.cj.restaurantbook.order.application.OperationsOrderService;
import com.cj.restaurantbook.order.presentation.dto.CompleteOperationOrderRequest;
import com.cj.restaurantbook.order.presentation.dto.OperationCancelOrderRequest;
import com.cj.restaurantbook.order.presentation.dto.OrderResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/operations/orders")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
@Tag(name = "Operations Orders", description = "직원/운영 주문 상태 관리")
public class OperationsOrderController {

    private final OperationsOrderService operationsOrderService;

    @GetMapping("/ready")
    @Operation(summary = "결제 대기 주문 목록 조회")
    public List<OrderResponse> readyOrders() {
        return operationsOrderService.findReadyOrders();
    }

    @GetMapping
    @Operation(summary = "직원 주문 보드 목록 조회")
    public List<OrderResponse> staffBoardOrders() {
        return operationsOrderService.findStaffBoardOrders();
    }

    @GetMapping("/canceled")
    @Operation(summary = "최근 취소 주문 목록 조회")
    public List<OrderResponse> canceled() {
        return operationsOrderService.findRecentCanceledOrders();
    }

    @PatchMapping("/canceled/acknowledge")
    @Operation(summary = "테이블 취소 안내 확인 처리")
    public void acknowledgeCanceled(@RequestParam String tableName) {
        operationsOrderService.acknowledgeCanceledOrders(tableName);
    }

    @PatchMapping("/{orderId}/complete")
    @Operation(summary = "결제 완료: READY -> COMPLETED")
    public OrderResponse complete(
            @PathVariable Long orderId,
            @Valid @RequestBody CompleteOperationOrderRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long handledBy = principal == null ? null : principal.getId();
        return operationsOrderService.complete(orderId, request.paymentMethod(), handledBy);
    }

    @PatchMapping("/{orderId}/cancel")
    @Operation(summary = "운영 취소: COMPLETED 전 주문 -> CANCELED")
    public OrderResponse cancel(
            @PathVariable Long orderId,
            @Valid @RequestBody OperationCancelOrderRequest request
    ) {
        return operationsOrderService.cancel(orderId, request.cancelMessage());
    }

    @PatchMapping("/{orderId}/refund")
    @Operation(summary = "결제 완료 주문 환불: COMPLETED -> CANCELED")
    public OrderResponse refund(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long handledBy = principal == null ? null : principal.getId();
        return operationsOrderService.refund(orderId, handledBy);
    }
}
