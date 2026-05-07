package com.cj.restaurantbook.order.application;

import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import com.cj.restaurantbook.order.domain.Order;
import com.cj.restaurantbook.order.domain.OrderItem;
import com.cj.restaurantbook.order.domain.OrderItemType;
import com.cj.restaurantbook.order.domain.OrderType;
import com.cj.restaurantbook.order.domain.OrderStatus;
import com.cj.restaurantbook.order.infrastructure.OrderRepository;
import com.cj.restaurantbook.order.presentation.dto.CreateOrderItemRequest;
import com.cj.restaurantbook.order.presentation.dto.CreateOrderRequest;
import com.cj.restaurantbook.order.presentation.dto.OrderResponse;
import com.cj.restaurantbook.sale_menu.domain.SaleMenu;
import com.cj.restaurantbook.sale_menu.domain.SaleMenuStatus;
import com.cj.restaurantbook.sale_menu.infrastructure.SaleMenuRepository;
import com.cj.restaurantbook.sale_menu_set.domain.SaleMenuSet;
import com.cj.restaurantbook.sale_menu_set.infrastructure.SaleMenuSetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final DateTimeFormatter ORDER_NO_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final OrderRepository orderRepository;
    private final SaleMenuRepository saleMenuRepository;
    private final SaleMenuSetRepository saleMenuSetRepository;

    @Transactional
    public OrderResponse createCustomerOrder(CreateOrderRequest request) {
        Map<OrderItemKey, Integer> normalizedItems = normalizeItems(request.items());

        List<OrderItem> orderItems = new ArrayList<>();
        int displayOrder = 0;
        for (Map.Entry<OrderItemKey, Integer> entry : normalizedItems.entrySet()) {
            OrderItemKey key = entry.getKey();
            int quantity = entry.getValue();
            orderItems.add(createOrderItem(request.orderType(), key, quantity, displayOrder++));
        }

        Order order = Order.create(generateOrderNo(), normalizeTableName(request.tableName()), request.orderType(), orderItems);
        Order saved = orderRepository.saveAndFlush(order);
        return OrderResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findActiveCustomerOrders(String tableName) {
        String normalizedTableName = normalizeTableName(tableName);
        if (normalizedTableName == null) {
            return List.of();
        }

        return orderRepository.findByTableNameAndStatusInOrderByCreatedAtAscIdAsc(
                        normalizedTableName,
                        List.of(OrderStatus.RECEIVED, OrderStatus.COOKING, OrderStatus.READY)
                ).stream()
                .map(OrderResponse::from)
                .toList();
    }

    @Transactional
    public OrderResponse cancelCustomerOrder(Long orderId, String tableName) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        String normalizedTableName = normalizeTableName(tableName);
        if (normalizedTableName == null || !normalizedTableName.equals(order.getTableName())) {
            throw new BusinessException(ErrorCode.ORDER_TABLE_MISMATCH);
        }
        if (!order.canCancelByCustomer()) {
            throw new BusinessException(ErrorCode.ORDER_CANCEL_NOT_ALLOWED);
        }

        order.cancel();
        return OrderResponse.from(order);
    }

    private Map<OrderItemKey, Integer> normalizeItems(List<CreateOrderItemRequest> items) {
        if (items == null || items.isEmpty()) {
            throw new BusinessException(ErrorCode.ORDER_EMPTY_ITEMS);
        }

        Map<OrderItemKey, Integer> normalized = new LinkedHashMap<>();
        for (CreateOrderItemRequest item : items) {
            if (item.quantity() < 1) {
                throw new BusinessException(ErrorCode.ORDER_ITEM_INVALID_QUANTITY);
            }
            OrderItemKey key = new OrderItemKey(item.type(), item.id());
            normalized.merge(key, item.quantity(), Integer::sum);
        }
        return normalized;
    }

    private OrderItem createOrderItem(OrderType orderType, OrderItemKey key, int quantity, int displayOrder) {
        return switch (key.type()) {
            case SALE_MENU -> createSaleMenuOrderItem(orderType, key.id(), quantity, displayOrder);
            case SALE_MENU_SET -> createSaleMenuSetOrderItem(orderType, key.id(), quantity, displayOrder);
        };
    }

    private OrderItem createSaleMenuOrderItem(OrderType orderType, Long id, int quantity, int displayOrder) {
        SaleMenu menu = saleMenuRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_ITEM_NOT_FOUND));

        if (!isOrderable(menu.isVisible(), menu.getStatus(), menu.isAvailableDineIn(), menu.isAvailableTakeout(), orderType)) {
            throw new BusinessException(ErrorCode.ORDER_ITEM_NOT_ORDERABLE);
        }

        return OrderItem.fromSaleMenu(menu, quantity, displayOrder);
    }

    private OrderItem createSaleMenuSetOrderItem(OrderType orderType, Long id, int quantity, int displayOrder) {
        SaleMenuSet set = saleMenuSetRepository.findByIdWithItems(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_ITEM_NOT_FOUND));

        if (!isOrderable(set.isVisible(), set.getStatus(), set.isAvailableDineIn(), set.isAvailableTakeout(), orderType)
                || set.getItems().isEmpty()) {
            throw new BusinessException(ErrorCode.ORDER_ITEM_NOT_ORDERABLE);
        }

        return OrderItem.fromSaleMenuSet(set, quantity, displayOrder);
    }

    private boolean isOrderable(
            boolean visible,
            SaleMenuStatus status,
            boolean availableDineIn,
            boolean availableTakeout,
            OrderType orderType
    ) {
        if (!visible || status != SaleMenuStatus.ACTIVE) {
            return false;
        }
        return switch (orderType) {
            case DINE_IN -> availableDineIn;
            case TAKEOUT -> availableTakeout;
        };
    }

    private String generateOrderNo() {
        for (int i = 0; i < 10; i++) {
            String orderNo = LocalDateTime.now().format(ORDER_NO_TIME_FORMAT)
                    + "-"
                    + ThreadLocalRandom.current().nextInt(1000, 10000);
            if (!orderRepository.existsByOrderNo(orderNo)) {
                return orderNo;
            }
        }
        throw new BusinessException(ErrorCode.INTERNAL_ERROR);
    }

    private String normalizeTableName(String tableName) {
        if (tableName == null) {
            return null;
        }

        String normalized = tableName.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        return normalized.length() > 80 ? normalized.substring(0, 80) : normalized;
    }

    private record OrderItemKey(OrderItemType type, Long id) {
    }
}
