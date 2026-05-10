package com.cj.restaurantbook.payment.domain;

import com.cj.restaurantbook.order.domain.Order;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(
        name = "payment_orders",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_payment_orders_order_id", columnNames = "order_id")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PaymentOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false)
    private int amount;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    static PaymentOrder create(Payment payment, Order order, int amount) {
        PaymentOrder paymentOrder = new PaymentOrder();
        paymentOrder.payment = payment;
        paymentOrder.order = order;
        paymentOrder.amount = amount;
        return paymentOrder;
    }
}
