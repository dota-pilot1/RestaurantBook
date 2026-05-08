package com.cj.restaurantbook.payment.application;

import com.cj.restaurantbook.order.domain.Order;
import com.cj.restaurantbook.payment.domain.Payment;
import com.cj.restaurantbook.payment.domain.PaymentMethod;
import com.cj.restaurantbook.payment.domain.PaymentStatus;
import com.cj.restaurantbook.payment.infrastructure.PaymentRepository;
import com.cj.restaurantbook.payment.presentation.dto.PaymentMethodSummaryResponse;
import com.cj.restaurantbook.payment.presentation.dto.SalesResponse;
import com.cj.restaurantbook.payment.presentation.dto.SalesSummaryResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.BeanUtils;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SalesServiceTest {

    private PaymentRepository paymentRepository;
    private SalesService salesService;

    @BeforeEach
    void setUp() {
        paymentRepository = mock(PaymentRepository.class);
        salesService = new SalesService(paymentRepository);
    }

    @Test
    void findSalesAggregatesPaidAndRefundedPaymentsSeparately() {
        LocalDate startDate = LocalDate.of(2026, 5, 8);
        LocalDate endDate = LocalDate.of(2026, 5, 8);
        Payment cardPayment = payment(1L, "ORDER-1", 12_000, PaymentMethod.CARD, PaymentStatus.PAID);
        Payment cashPayment = payment(2L, "ORDER-2", 8_000, PaymentMethod.CASH, PaymentStatus.PAID);
        Payment refundedPayment = payment(3L, "ORDER-3", 5_000, PaymentMethod.CARD, PaymentStatus.REFUNDED);

        when(paymentRepository.findByStatusAndPaidAtRangeWithOrder(
                PaymentStatus.PAID,
                Instant.parse("2026-05-07T15:00:00Z"),
                Instant.parse("2026-05-08T15:00:00Z")
        )).thenReturn(List.of(cardPayment, cashPayment));
        when(paymentRepository.findByStatusAndRefundedAtRangeWithOrder(
                PaymentStatus.REFUNDED,
                Instant.parse("2026-05-07T15:00:00Z"),
                Instant.parse("2026-05-08T15:00:00Z")
        )).thenReturn(List.of(refundedPayment));

        SalesResponse response = salesService.findSales(startDate, endDate);

        assertEquals(20_000, response.totalAmount());
        assertEquals(2, response.paymentCount());
        assertEquals(5_000, response.refundAmount());
        assertEquals(1, response.refundCount());
        assertEquals(2, response.recentPayments().size());
        assertEquals(1, response.refundedPayments().size());
        assertNotNull(response.refundedPayments().getFirst().refundedAt());

        Map<PaymentMethod, PaymentMethodSummaryResponse> summaries = response.methodSummaries().stream()
                .collect(Collectors.toMap(PaymentMethodSummaryResponse::method, Function.identity()));
        assertEquals(PaymentMethod.values().length, summaries.size());
        assertEquals(12_000, summaries.get(PaymentMethod.CARD).amount());
        assertEquals(1, summaries.get(PaymentMethod.CARD).count());
        assertEquals(8_000, summaries.get(PaymentMethod.CASH).amount());
        assertEquals(1, summaries.get(PaymentMethod.CASH).count());
        assertEquals(0, summaries.get(PaymentMethod.ETC).amount());
        assertEquals(0, summaries.get(PaymentMethod.ETC).count());
    }

    @Test
    void findSalesUsesRefundedAtRangeForRefundAggregation() {
        LocalDate startDate = LocalDate.of(2026, 5, 8);
        LocalDate endDate = LocalDate.of(2026, 5, 9);
        when(paymentRepository.findByStatusAndPaidAtRangeWithOrder(
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        )).thenReturn(List.of());
        when(paymentRepository.findByStatusAndRefundedAtRangeWithOrder(
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        )).thenReturn(List.of());

        salesService.findSales(startDate, endDate);

        ArgumentCaptor<PaymentStatus> statusCaptor = ArgumentCaptor.forClass(PaymentStatus.class);
        ArgumentCaptor<Instant> startCaptor = ArgumentCaptor.forClass(Instant.class);
        ArgumentCaptor<Instant> endCaptor = ArgumentCaptor.forClass(Instant.class);
        verify(paymentRepository).findByStatusAndRefundedAtRangeWithOrder(
                statusCaptor.capture(),
                startCaptor.capture(),
                endCaptor.capture()
        );

        assertEquals(PaymentStatus.REFUNDED, statusCaptor.getValue());
        assertEquals(Instant.parse("2026-05-07T15:00:00Z"), startCaptor.getValue());
        assertEquals(Instant.parse("2026-05-09T15:00:00Z"), endCaptor.getValue());
    }

    @Test
    void findSalesLimitsRecentPaymentAndRefundListsToFifty() {
        LocalDate date = LocalDate.of(2026, 5, 8);
        List<Payment> paidPayments = IntStream.rangeClosed(1, 55)
                .mapToObj(index -> payment((long) index, "PAID-" + index, 1_000, PaymentMethod.CARD, PaymentStatus.PAID))
                .toList();
        List<Payment> refundedPayments = IntStream.rangeClosed(1, 55)
                .mapToObj(index -> payment(100L + index, "REFUND-" + index, 1_000, PaymentMethod.CASH, PaymentStatus.REFUNDED))
                .toList();

        when(paymentRepository.findByStatusAndPaidAtRangeWithOrder(
                org.mockito.ArgumentMatchers.eq(PaymentStatus.PAID),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        )).thenReturn(paidPayments);
        when(paymentRepository.findByStatusAndRefundedAtRangeWithOrder(
                org.mockito.ArgumentMatchers.eq(PaymentStatus.REFUNDED),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        )).thenReturn(refundedPayments);

        SalesResponse response = salesService.findSales(date, date);

        assertEquals(55, response.paymentCount());
        assertEquals(55, response.refundCount());
        assertEquals(50, response.recentPayments().size());
        assertEquals(50, response.refundedPayments().size());
        assertEquals("PAID-1", response.recentPayments().getFirst().orderNo());
        assertEquals("REFUND-1", response.refundedPayments().getFirst().orderNo());
    }

    @Test
    void todaySummaryReturnsAllPaymentMethodsEvenWhenThereAreNoPayments() {
        when(paymentRepository.findByStatusAndPaidAtRangeWithOrder(
                org.mockito.ArgumentMatchers.eq(PaymentStatus.PAID),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        )).thenReturn(List.of());
        when(paymentRepository.findByStatusAndRefundedAtRangeWithOrder(
                org.mockito.ArgumentMatchers.eq(PaymentStatus.REFUNDED),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        )).thenReturn(List.of());

        SalesSummaryResponse response = salesService.todaySummary();

        assertEquals(0, response.totalAmount());
        assertEquals(0, response.refundAmount());
        assertEquals(PaymentMethod.values().length, response.methodSummaries().size());
        response.methodSummaries().forEach(summary -> {
            assertEquals(0, summary.amount());
            assertEquals(0, summary.count());
        });
    }

    private Payment payment(
            Long id,
            String orderNo,
            int amount,
            PaymentMethod method,
            PaymentStatus status
    ) {
        Order order = BeanUtils.instantiateClass(Order.class);
        ReflectionTestUtils.setField(order, "id", id);
        ReflectionTestUtils.setField(order, "orderNo", orderNo);
        ReflectionTestUtils.setField(order, "tableName", id + "번 테이블");
        ReflectionTestUtils.setField(order, "totalAmount", amount);

        Payment payment = BeanUtils.instantiateClass(Payment.class);
        ReflectionTestUtils.setField(payment, "id", id);
        ReflectionTestUtils.setField(payment, "order", order);
        ReflectionTestUtils.setField(payment, "amount", amount);
        ReflectionTestUtils.setField(payment, "method", method);
        ReflectionTestUtils.setField(payment, "status", status);
        ReflectionTestUtils.setField(payment, "paidAt", Instant.parse("2026-05-08T03:00:00Z"));
        ReflectionTestUtils.setField(payment, "handledBy", 10L);
        if (status == PaymentStatus.REFUNDED) {
            ReflectionTestUtils.setField(payment, "refundedAt", Instant.parse("2026-05-08T05:00:00Z"));
            ReflectionTestUtils.setField(payment, "refundedBy", 11L);
        }
        return payment;
    }
}
