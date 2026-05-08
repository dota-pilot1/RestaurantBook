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
        List<Payment> paidPayments = findPaidPayments(today, today);
        List<Payment> refundedPayments = findRefundedPayments(today, today);
        return toSummary(paidPayments, refundedPayments);
    }

    @Transactional(readOnly = true)
    public SalesResponse findSales(LocalDate startDate, LocalDate endDate) {
        LocalDate normalizedEnd = endDate == null ? LocalDate.now(BUSINESS_ZONE) : endDate;
        LocalDate normalizedStart = startDate == null ? normalizedEnd : startDate;
        if (normalizedStart.isAfter(normalizedEnd)) {
            normalizedStart = normalizedEnd;
        }

        List<Payment> paidPayments = findPaidPayments(normalizedStart, normalizedEnd);
        List<Payment> refundedPayments = findRefundedPayments(normalizedStart, normalizedEnd);
        SalesSummaryResponse summary = toSummary(paidPayments, refundedPayments);
        List<PaymentListItemResponse> recentPayments = paidPayments.stream()
                .limit(50)
                .map(PaymentListItemResponse::from)
                .toList();
        List<PaymentListItemResponse> recentRefundedPayments = refundedPayments.stream()
                .limit(50)
                .map(PaymentListItemResponse::from)
                .toList();

        return new SalesResponse(
                normalizedStart,
                normalizedEnd,
                summary.totalAmount(),
                summary.paymentCount(),
                summary.refundAmount(),
                summary.refundCount(),
                summary.methodSummaries(),
                recentPayments,
                recentRefundedPayments
        );
    }

    private List<Payment> findPaidPayments(LocalDate startDate, LocalDate endDate) {
        Instant start = startDate.atStartOfDay(BUSINESS_ZONE).toInstant();
        Instant end = endDate.plusDays(1).atStartOfDay(BUSINESS_ZONE).toInstant();
        return paymentRepository.findByStatusAndPaidAtRangeWithOrder(PaymentStatus.PAID, start, end);
    }

    private List<Payment> findRefundedPayments(LocalDate startDate, LocalDate endDate) {
        Instant start = startDate.atStartOfDay(BUSINESS_ZONE).toInstant();
        Instant end = endDate.plusDays(1).atStartOfDay(BUSINESS_ZONE).toInstant();
        return paymentRepository.findByStatusAndRefundedAtRangeWithOrder(PaymentStatus.REFUNDED, start, end);
    }

    private SalesSummaryResponse toSummary(List<Payment> payments, List<Payment> refundedPayments) {
        long totalAmount = payments.stream().mapToLong(Payment::getAmount).sum();
        long refundAmount = refundedPayments.stream().mapToLong(Payment::getAmount).sum();
        Map<PaymentMethod, List<Payment>> byMethod = payments.stream()
                .collect(Collectors.groupingBy(Payment::getMethod));
        List<PaymentMethodSummaryResponse> methodSummaries = Arrays.stream(PaymentMethod.values())
                .map(method -> {
                    List<Payment> methodPayments = byMethod.getOrDefault(method, List.of());
                    long amount = methodPayments.stream().mapToLong(Payment::getAmount).sum();
                    return new PaymentMethodSummaryResponse(method, amount, methodPayments.size());
                })
                .toList();
        return new SalesSummaryResponse(totalAmount, payments.size(), refundAmount, refundedPayments.size(), methodSummaries);
    }
}
