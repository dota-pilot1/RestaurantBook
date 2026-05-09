package com.cj.restaurantbook.order.infrastructure;

import com.cj.restaurantbook.order.domain.Order;
import com.cj.restaurantbook.order.domain.OrderStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Collection;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    boolean existsByOrderNo(String orderNo);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Order> findForUpdateById(Long id);

    long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant start, Instant end);

    long countByStatus(OrderStatus status);

    long countByStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            OrderStatus status,
            Instant start,
            Instant end
    );

    List<Order> findByTableNameAndStatusInOrderByCreatedAtAscIdAsc(
            String tableName,
            Collection<OrderStatus> statuses
    );

    List<Order> findByStatusInOrderByCreatedAtAscIdAsc(Collection<OrderStatus> statuses);

    List<Order> findTop10ByStatusAndCancelMessageIsNotNullOrderByUpdatedAtDescIdDesc(OrderStatus status);

    List<Order> findTop10ByStatusAndCancelMessageIsNotNullAndKitchenCancelDismissedAtIsNullOrderByUpdatedAtDescIdDesc(
            OrderStatus status
    );

    List<Order> findTop10ByTableNameAndStatusAndCancelMessageIsNotNullOrderByUpdatedAtDescIdDesc(
            String tableName,
            OrderStatus status
    );

    List<Order> findByTableNameAndStatusAndCancelMessageIsNotNullOrderByUpdatedAtDescIdDesc(
            String tableName,
            OrderStatus status
    );
}
