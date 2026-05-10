package com.cj.restaurantbook.payment.infrastructure;

import com.cj.restaurantbook.payment.domain.PaymentOrder;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, Long> {
    boolean existsByOrderId(Long orderId);

    boolean existsByOrderIdIn(Collection<Long> orderIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select distinct po
            from PaymentOrder po
            join fetch po.payment p
            left join fetch p.paymentOrders linkedPo
            left join fetch linkedPo.order linkedOrder
            where po.order.id = :orderId
            """)
    Optional<PaymentOrder> findForUpdateByOrderId(@Param("orderId") Long orderId);

    @Query("""
            select po
            from PaymentOrder po
            join fetch po.order o
            where po.payment.id in :paymentIds
            order by po.id asc
            """)
    List<PaymentOrder> findByPaymentIdInWithOrder(@Param("paymentIds") Collection<Long> paymentIds);

    @Query("""
            select po
            from PaymentOrder po
            join fetch po.order o
            join fetch po.payment p
            where po.order.id in :orderIds
            """)
    List<PaymentOrder> findByOrderIdInWithPayment(@Param("orderIds") Collection<Long> orderIds);
}
