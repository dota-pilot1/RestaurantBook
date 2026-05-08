package com.cj.restaurantbook.manager.presentation.dto;

public record ManagerDashboardResponse(
        long todayOrderCount,
        long receivedCount,
        long acceptedCount,
        long cookingCount,
        long readyCount,
        long canceledTodayCount,
        long pendingStaffCallCount
) {
}
