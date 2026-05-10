package com.cj.restaurantbook.payment.domain;

import com.cj.restaurantbook.order.domain.Order;
import jakarta.persistence.Column;
import jakarta.persistence.CascadeType;
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
@Table(name = "payments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<PaymentOrder> paymentOrders = new ArrayList<>();

    @Column(nullable = false)
    private int amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentMethod method;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status;

    @Column(nullable = false)
    private Instant paidAt;

    @Column(name = "handled_by")
    private Long handledBy;

    @Column(name = "refunded_at")
    private Instant refundedAt;

    @Column(name = "refunded_by")
    private Long refundedBy;

    @Column(length = 20)
    private String provider;

    @Column(name = "provider_payment_key", length = 200)
    private String providerPaymentKey;

    @Column(name = "provider_order_id", length = 100)
    private String providerOrderId;

    @Column(name = "provider_method", length = 50)
    private String providerMethod;

    @Column(name = "receipt_url", length = 500)
    private String receiptUrl;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static Payment paid(Order order, PaymentMethod method, Long handledBy) {
        return paid(List.of(order), order.getTotalAmount(), method, handledBy);
    }

    public static Payment paid(List<Order> orders, int amount, PaymentMethod method, Long handledBy) {
        Payment payment = new Payment();
        payment.amount = amount;
        payment.method = method;
        payment.status = PaymentStatus.PAID;
        payment.paidAt = Instant.now();
        payment.handledBy = handledBy;
        orders.forEach(order -> payment.addPaymentOrder(order, order.getTotalAmount()));
        return payment;
    }

    public static Payment tossPaid(
            List<Order> orders,
            int amount,
            PaymentMethod method,
            String providerPaymentKey,
            String providerOrderId,
            String providerMethod,
            String receiptUrl,
            Instant approvedAt
    ) {
        Payment payment = paid(orders, amount, method, null);
        payment.provider = "TOSS";
        payment.providerPaymentKey = providerPaymentKey;
        payment.providerOrderId = providerOrderId;
        payment.providerMethod = providerMethod;
        payment.receiptUrl = receiptUrl;
        payment.approvedAt = approvedAt;
        return payment;
    }

    private void addPaymentOrder(Order order, int amount) {
        PaymentOrder paymentOrder = PaymentOrder.create(this, order, amount);
        this.paymentOrders.add(paymentOrder);
    }

    public void refund(Long handledBy) {
        if (this.status != PaymentStatus.PAID) {
            throw new IllegalStateException("Invalid payment status transition: " + this.status + " -> " + PaymentStatus.REFUNDED);
        }
        this.status = PaymentStatus.REFUNDED;
        this.refundedAt = Instant.now();
        this.refundedBy = handledBy;
    }
}
