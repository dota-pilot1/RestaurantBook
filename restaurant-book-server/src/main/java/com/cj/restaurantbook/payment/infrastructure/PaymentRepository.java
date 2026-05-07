package com.cj.restaurantbook.payment.infrastructure;

import com.cj.restaurantbook.payment.domain.Payment;
import com.cj.restaurantbook.payment.domain.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    boolean existsByOrderId(Long orderId);

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
}
