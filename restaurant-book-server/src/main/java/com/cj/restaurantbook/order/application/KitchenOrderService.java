package com.cj.restaurantbook.order.application;

import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import com.cj.restaurantbook.order.domain.Order;
import com.cj.restaurantbook.order.domain.OrderStatus;
import com.cj.restaurantbook.order.infrastructure.OrderRepository;
import com.cj.restaurantbook.order.presentation.dto.OrderResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class KitchenOrderService {

    private final OrderRepository orderRepository;
    private final OrderBroadcaster orderBroadcaster;

    @Transactional(readOnly = true)
    public List<OrderResponse> findKitchenOrders() {
        return orderRepository.findByStatusInOrderByCreatedAtAscIdAsc(
                        List.of(OrderStatus.RECEIVED, OrderStatus.ACCEPTED, OrderStatus.COOKING, OrderStatus.READY)
                ).stream()
                .map(OrderResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findRecentCanceledOrders() {
        return orderRepository.findTop10ByStatusAndCancelMessageIsNotNullAndKitchenCancelDismissedAtIsNullOrderByUpdatedAtDescIdDesc(
                        OrderStatus.CANCELED
                ).stream()
                .map(OrderResponse::from)
                .toList();
    }

    @Transactional
    public OrderResponse accept(Long orderId) {
        Order order = findOrder(orderId);
        transition(order, Order::accept);
        if (!order.requiresCooking()) {
            transition(order, Order::markReady);
            orderBroadcaster.broadcastOrderChangedAfterCommit("READY", order.getId(), order.getTableName());
            return OrderResponse.from(order);
        }
        orderBroadcaster.broadcastOrderChangedAfterCommit("ACCEPTED", order.getId(), order.getTableName());
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse startCooking(Long orderId) {
        Order order = findOrder(orderId);
        transition(order, Order::startCooking);
        orderBroadcaster.broadcastOrderChangedAfterCommit("COOKING", order.getId(), order.getTableName());
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse ready(Long orderId) {
        Order order = findOrder(orderId);
        transition(order, Order::markReady);
        orderBroadcaster.broadcastOrderChangedAfterCommit("READY", order.getId(), order.getTableName());
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse cancel(Long orderId, String cancelMessage) {
        Order order = findOrder(orderId);
        if (!order.canCancelByOperations()) {
            throw new BusinessException(ErrorCode.ORDER_STATUS_TRANSITION_NOT_ALLOWED);
        }

        order.cancel(cancelMessage);
        orderBroadcaster.broadcastOrderChangedAfterCommit("CANCELED", order.getId(), order.getTableName(), order.getCancelMessage());
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse confirmCancelNotice(Long orderId) {
        Order order = findOrder(orderId);
        transition(order, Order::confirmKitchenCancelNotice);
        orderBroadcaster.broadcastOrderChangedAfterCommit("KITCHEN_CANCEL_NOTICE_CONFIRMED", order.getId(), order.getTableName());
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse dismissCancelNotice(Long orderId) {
        Order order = findOrder(orderId);
        transition(order, Order::dismissKitchenCancelNotice);
        orderBroadcaster.broadcastOrderChangedAfterCommit("KITCHEN_CANCEL_NOTICE_DISMISSED", order.getId(), order.getTableName());
        return OrderResponse.from(order);
    }

    private Order findOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
    }

    private void transition(Order order, OrderTransition transition) {
        try {
            transition.apply(order);
        } catch (IllegalStateException e) {
            throw new BusinessException(ErrorCode.ORDER_STATUS_TRANSITION_NOT_ALLOWED);
        }
    }

    @FunctionalInterface
    private interface OrderTransition {
        void apply(Order order);
    }
}
