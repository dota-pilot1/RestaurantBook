package com.cj.restaurantbook.payment.infrastructure;

import com.cj.restaurantbook.payment.domain.Payment;
import com.cj.restaurantbook.payment.domain.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByProviderAndProviderPaymentKey(String provider, String providerPaymentKey);

    @Query("""
            select distinct p
            from Payment p
            left join fetch p.paymentOrders po
            left join fetch po.order o
            where p.provider = :provider
              and p.providerPaymentKey = :providerPaymentKey
            """)
    Optional<Payment> findByProviderAndProviderPaymentKeyWithOrders(
            @Param("provider") String provider,
            @Param("providerPaymentKey") String providerPaymentKey
    );

    @Query("""
            select distinct p
            from Payment p
            left join fetch p.paymentOrders po
            left join fetch po.order o
            where p.status = :status
              and p.paidAt >= :start
              and p.paidAt < :end
            order by p.paidAt desc, p.id desc
            """)
    List<Payment> findByStatusAndPaidAtRangeWithOrder(
            @Param("status") PaymentStatus status,
            @Param("start") Instant start,
            @Param("end") Instant end
    );

    @Query("""
            select distinct p
            from Payment p
            left join fetch p.paymentOrders po
            left join fetch po.order o
            where p.status = :status
              and p.refundedAt >= :start
              and p.refundedAt < :end
            order by p.refundedAt desc, p.id desc
            """)
    List<Payment> findByStatusAndRefundedAtRangeWithOrder(
            @Param("status") PaymentStatus status,
            @Param("start") Instant start,
            @Param("end") Instant end
    );
}
