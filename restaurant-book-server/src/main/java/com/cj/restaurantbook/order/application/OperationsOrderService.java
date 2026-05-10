package com.cj.restaurantbook.order.application;

import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import com.cj.restaurantbook.order.domain.Order;
import com.cj.restaurantbook.order.domain.OrderStatus;
import com.cj.restaurantbook.order.infrastructure.OrderRepository;
import com.cj.restaurantbook.order.presentation.dto.OrderResponse;
import com.cj.restaurantbook.payment.domain.Payment;
import com.cj.restaurantbook.payment.domain.PaymentMethod;
import com.cj.restaurantbook.payment.domain.PaymentOrder;
import com.cj.restaurantbook.payment.domain.PaymentRefund;
import com.cj.restaurantbook.payment.infrastructure.PaymentOrderRepository;
import com.cj.restaurantbook.payment.infrastructure.PaymentRefundRepository;
import com.cj.restaurantbook.payment.infrastructure.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OperationsOrderService {

    private final OrderRepository orderRepository;
    private final OrderBroadcaster orderBroadcaster;
    private final PaymentRepository paymentRepository;
    private final PaymentOrderRepository paymentOrderRepository;
    private final PaymentRefundRepository paymentRefundRepository;

    @Transactional(readOnly = true)
    public List<OrderResponse> findReadyOrders() {
        return orderRepository.findByStatusInOrderByCreatedAtAscIdAsc(List.of(OrderStatus.READY)).stream()
                .map(OrderResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findStaffBoardOrders() {
        List<Order> orders = orderRepository.findByStatusInOrderByCreatedAtAscIdAsc(
                        List.of(OrderStatus.ACCEPTED, OrderStatus.COOKING, OrderStatus.READY, OrderStatus.COMPLETED)
                );
        List<Long> completedOrderIds = orders.stream()
                .filter(order -> order.getStatus() == OrderStatus.COMPLETED)
                .map(Order::getId)
                .toList();
        Map<Long, Payment> paymentByOrderId = completedOrderIds.isEmpty()
                ? Map.of()
                : paymentOrderRepository.findByOrderIdInWithPayment(completedOrderIds).stream()
                        .collect(Collectors.toMap(
                                paymentOrder -> paymentOrder.getOrder().getId(),
                                PaymentOrder::getPayment,
                                (left, right) -> left
                        ));
        return orders.stream()
                .map(order -> OrderResponse.from(order, paymentByOrderId.get(order.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findRecentCanceledOrders() {
        return orderRepository.findTop10ByStatusAndCancelMessageIsNotNullOrderByUpdatedAtDescIdDesc(
                        OrderStatus.CANCELED
                ).stream()
                .map(OrderResponse::from)
                .toList();
    }

    @Transactional
    public void acknowledgeCanceledOrders(String tableName) {
        if (tableName == null || tableName.isBlank()) {
            return;
        }

        String normalizedTableName = tableName.trim();
        List<Order> orders = orderRepository.findByTableNameAndStatusAndCancelMessageIsNotNullOrderByUpdatedAtDescIdDesc(
                normalizedTableName.length() > 80 ? normalizedTableName.substring(0, 80) : normalizedTableName,
                OrderStatus.CANCELED
        );
        orders.forEach(Order::clearCancelMessage);
        orders.forEach(order ->
                orderBroadcaster.broadcastOrderChangedAfterCommit("CANCELED_ACKNOWLEDGED", order.getId(), order.getTableName())
        );
    }

    @Transactional
    public OrderResponse complete(Long orderId, PaymentMethod paymentMethod, Long handledBy) {
        Order order = orderRepository.findForUpdateById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        if (paymentOrderRepository.existsByOrderId(orderId)) {
            throw new BusinessException(ErrorCode.PAYMENT_ALREADY_EXISTS);
        }
        try {
            order.complete();
        } catch (IllegalStateException e) {
            throw new BusinessException(ErrorCode.ORDER_STATUS_TRANSITION_NOT_ALLOWED);
        }
        Payment payment = paymentRepository.save(Payment.paid(order, paymentMethod, handledBy));
        orderBroadcaster.broadcastOrderChangedAfterCommit("COMPLETED", order.getId(), order.getTableName());
        return OrderResponse.from(order, payment);
    }

    @Transactional
    public OrderResponse cancel(Long orderId, String cancelMessage) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        if (!order.canCancelByOperations()) {
            throw new BusinessException(ErrorCode.ORDER_STATUS_TRANSITION_NOT_ALLOWED);
        }

        order.cancel(cancelMessage);
        orderBroadcaster.broadcastOrderChangedAfterCommit("CANCELED", order.getId(), order.getTableName(), order.getCancelMessage());
        return OrderResponse.from(order);
    }

    @Transactional
    public OrderResponse refund(Long orderId, Long handledBy) {
        Order order = orderRepository.findForUpdateById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        Payment payment = paymentOrderRepository.findForUpdateByOrderId(orderId)
                .map(PaymentOrder::getPayment)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));

        try {
            for (PaymentOrder paymentOrder : payment.getPaymentOrders()) {
                paymentOrder.getOrder().refund();
            }
            payment.refund(handledBy);
            paymentRefundRepository.save(PaymentRefund.completed(payment, payment.getAmount(), "운영 환불", handledBy));
        } catch (IllegalStateException e) {
            throw new BusinessException(ErrorCode.PAYMENT_REFUND_NOT_ALLOWED);
        }

        for (PaymentOrder paymentOrder : payment.getPaymentOrders()) {
            Order refundedOrder = paymentOrder.getOrder();
            orderBroadcaster.broadcastOrderChangedAfterCommit(
                    "REFUNDED",
                    refundedOrder.getId(),
                    refundedOrder.getTableName(),
                    refundedOrder.getCancelMessage()
            );
        }
        return OrderResponse.from(order);
    }
}
