package com.cj.restaurantbook.order.infrastructure;

import com.cj.restaurantbook.order.domain.Order;
import com.cj.restaurantbook.order.domain.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    boolean existsByOrderNo(String orderNo);

    List<Order> findByTableNameAndStatusInOrderByCreatedAtAscIdAsc(
            String tableName,
            Collection<OrderStatus> statuses
    );
}
