package com.cj.restaurantbook.payment.presentation;

import com.cj.restaurantbook.payment.application.SalesService;
import com.cj.restaurantbook.payment.presentation.dto.SalesResponse;
import com.cj.restaurantbook.payment.presentation.dto.SalesSummaryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/sales")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@Tag(name = "Sales", description = "Payment 기반 매출 조회")
public class SalesController {

    private final SalesService salesService;

    @GetMapping("/today-summary")
    @Operation(summary = "오늘 매출 요약")
    public SalesSummaryResponse todaySummary() {
        return salesService.todaySummary();
    }

    @GetMapping
    @Operation(summary = "기간별 매출 상세 조회")
    public SalesResponse sales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return salesService.findSales(startDate, endDate);
    }
}
