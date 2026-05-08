package com.cj.restaurantbook.payment.infrastructure;

import com.cj.restaurantbook.payment.domain.Payment;
import com.cj.restaurantbook.payment.domain.PaymentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    boolean existsByOrderId(Long orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Payment> findForUpdateByOrderId(Long orderId);

    @Query("""
            select p
            from Payment p
            join fetch p.order o
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
            select p
            from Payment p
            join fetch p.order o
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
