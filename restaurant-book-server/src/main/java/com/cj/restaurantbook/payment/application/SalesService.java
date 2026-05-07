package com.cj.restaurantbook.payment.application;

import com.cj.restaurantbook.payment.domain.Payment;
import com.cj.restaurantbook.payment.domain.PaymentMethod;
import com.cj.restaurantbook.payment.domain.PaymentStatus;
import com.cj.restaurantbook.payment.infrastructure.PaymentRepository;
import com.cj.restaurantbook.payment.presentation.dto.PaymentListItemResponse;
import com.cj.restaurantbook.payment.presentation.dto.PaymentMethodSummaryResponse;
import com.cj.restaurantbook.payment.presentation.dto.SalesResponse;
import com.cj.restaurantbook.payment.presentation.dto.SalesSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SalesService {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Seoul");

    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public SalesSummaryResponse todaySummary() {
        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        List<Payment> payments = findPaidPayments(today, today);
        return toSummary(payments);
    }

    @Transactional(readOnly = true)
    public SalesResponse findSales(LocalDate startDate, LocalDate endDate) {
        LocalDate normalizedEnd = endDate == null ? LocalDate.now(BUSINESS_ZONE) : endDate;
        LocalDate normalizedStart = startDate == null ? normalizedEnd : startDate;
        if (normalizedStart.isAfter(normalizedEnd)) {
            normalizedStart = normalizedEnd;
        }

        List<Payment> payments = findPaidPayments(normalizedStart, normalizedEnd);
        SalesSummaryResponse summary = toSummary(payments);
        List<PaymentListItemResponse> recentPayments = payments.stream()
                .limit(50)
                .map(PaymentListItemResponse::from)
                .toList();

        return new SalesResponse(
                normalizedStart,
                normalizedEnd,
                summary.totalAmount(),
                summary.paymentCount(),
                summary.methodSummaries(),
                recentPayments
        );
    }

    private List<Payment> findPaidPayments(LocalDate startDate, LocalDate endDate) {
        Instant start = startDate.atStartOfDay(BUSINESS_ZONE).toInstant();
        Instant end = endDate.plusDays(1).atStartOfDay(BUSINESS_ZONE).toInstant();
        return paymentRepository.findByStatusAndPaidAtRangeWithOrder(PaymentStatus.PAID, start, end);
    }

    private SalesSummaryResponse toSummary(List<Payment> payments) {
        long totalAmount = payments.stream().mapToLong(Payment::getAmount).sum();
        Map<PaymentMethod, List<Payment>> byMethod = payments.stream()
                .collect(Collectors.groupingBy(Payment::getMethod));
        List<PaymentMethodSummaryResponse> methodSummaries = Arrays.stream(PaymentMethod.values())
                .map(method -> {
                    List<Payment> methodPayments = byMethod.getOrDefault(method, List.of());
                    long amount = methodPayments.stream().mapToLong(Payment::getAmount).sum();
                    return new PaymentMethodSummaryResponse(method, amount, methodPayments.size());
                })
                .toList();
        return new SalesSummaryResponse(totalAmount, payments.size(), methodSummaries);
    }
}
