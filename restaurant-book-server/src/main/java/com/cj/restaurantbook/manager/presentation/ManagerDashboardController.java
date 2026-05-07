package com.cj.restaurantbook.manager.presentation;

import com.cj.restaurantbook.manager.application.ManagerDashboardService;
import com.cj.restaurantbook.manager.presentation.dto.ManagerDashboardResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/manager/dashboard")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Tag(name = "Manager Dashboard", description = "매니저 운영 현황 요약")
public class ManagerDashboardController {

    private final ManagerDashboardService managerDashboardService;

    @GetMapping
    @Operation(summary = "매니저 운영 현황 요약")
    public ManagerDashboardResponse dashboard() {
        return managerDashboardService.getDashboard();
    }
}
