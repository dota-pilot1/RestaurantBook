package com.cj.restaurantbook.order.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String orderNo;

    @Column(length = 80)
    private String tableName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderType orderType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderStatus status = OrderStatus.RECEIVED;

    @Column(nullable = false)
    private int totalAmount;

    @Column(length = 500)
    private String cancelMessage;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<OrderItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static Order create(String orderNo, String tableName, OrderType orderType, List<OrderItem> items) {
        Order order = new Order();
        order.orderNo = orderNo;
        order.tableName = tableName;
        order.orderType = orderType;
        order.status = OrderStatus.RECEIVED;
        items.forEach(order::addItem);
        order.recalculateTotalAmount();
        return order;
    }

    private void addItem(OrderItem item) {
        item.assignTo(this);
        this.items.add(item);
    }

    public void recalculateTotalAmount() {
        this.totalAmount = items.stream()
                .mapToInt(OrderItem::getLineTotal)
                .sum();
    }

    public boolean canCancelByCustomer() {
        return this.status == OrderStatus.RECEIVED;
    }

    public boolean canCancelByOperations() {
        return this.status != OrderStatus.CANCELED && this.status != OrderStatus.COMPLETED;
    }

    public void cancel(String cancelMessage) {
        this.status = OrderStatus.CANCELED;
        this.cancelMessage = normalizeCancelMessage(cancelMessage);
    }

    public void refund() {
        if (this.status != OrderStatus.COMPLETED) {
            throw new IllegalStateException("Invalid order status transition: " + this.status + " -> " + OrderStatus.CANCELED);
        }
        this.status = OrderStatus.CANCELED;
        this.cancelMessage = "환불 처리됨";
    }

    public void clearCancelMessage() {
        this.cancelMessage = null;
    }

    public void accept() {
        transition(OrderStatus.RECEIVED, OrderStatus.ACCEPTED);
    }

    public void startCooking() {
        transition(OrderStatus.ACCEPTED, OrderStatus.COOKING);
    }

    public boolean requiresCooking() {
        return items.isEmpty() || items.stream().anyMatch(OrderItem::isRequiresCooking);
    }

    public void markReady() {
        if (this.status != OrderStatus.ACCEPTED && this.status != OrderStatus.COOKING) {
            throw new IllegalStateException("Invalid order status transition: " + this.status + " -> " + OrderStatus.READY);
        }
        this.status = OrderStatus.READY;
    }

    public void complete() {
        transition(OrderStatus.READY, OrderStatus.COMPLETED);
    }

    private void transition(OrderStatus expected, OrderStatus next) {
        if (this.status != expected) {
            throw new IllegalStateException("Invalid order status transition: " + this.status + " -> " + next);
        }
        this.status = next;
    }

    private String normalizeCancelMessage(String message) {
        if (message == null) {
            return null;
        }
        String normalized = message.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        return normalized.length() > 500 ? normalized.substring(0, 500) : normalized;
    }
}
