package com.cj.restaurantbook.order.infrastructure;

import com.cj.restaurantbook.order.domain.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
    boolean existsByOrderNo(String orderNo);
}
