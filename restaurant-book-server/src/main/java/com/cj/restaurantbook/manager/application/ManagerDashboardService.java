package com.cj.restaurantbook.manager.application;

import com.cj.restaurantbook.manager.presentation.dto.ManagerDashboardResponse;
import com.cj.restaurantbook.order.domain.OrderStatus;
import com.cj.restaurantbook.order.infrastructure.OrderRepository;
import com.cj.restaurantbook.staff_call.domain.StaffCallStatus;
import com.cj.restaurantbook.staff_call.infrastructure.StaffCallRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class ManagerDashboardService {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Seoul");

    private final OrderRepository orderRepository;
    private final StaffCallRepository staffCallRepository;

    @Transactional(readOnly = true)
    public ManagerDashboardResponse getDashboard() {
        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        Instant start = today.atStartOfDay(BUSINESS_ZONE).toInstant();
        Instant end = today.plusDays(1).atStartOfDay(BUSINESS_ZONE).toInstant();

        return new ManagerDashboardResponse(
                orderRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(start, end),
                orderRepository.countByStatus(OrderStatus.RECEIVED),
                orderRepository.countByStatus(OrderStatus.ACCEPTED),
                orderRepository.countByStatus(OrderStatus.COOKING),
                orderRepository.countByStatus(OrderStatus.READY),
                orderRepository.countByStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                        OrderStatus.CANCELED,
                        start,
                        end
                ),
                staffCallRepository.countByStatus(StaffCallStatus.PENDING)
        );
    }
}
