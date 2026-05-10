package com.cj.restaurantbook.payment.application;

import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import com.cj.restaurantbook.order.application.OrderBroadcaster;
import com.cj.restaurantbook.order.domain.Order;
import com.cj.restaurantbook.order.domain.OrderStatus;
import com.cj.restaurantbook.order.infrastructure.OrderRepository;
import com.cj.restaurantbook.order.presentation.dto.OrderResponse;
import com.cj.restaurantbook.payment.domain.Payment;
import com.cj.restaurantbook.payment.domain.PaymentMethod;
import com.cj.restaurantbook.payment.infrastructure.PaymentOrderRepository;
import com.cj.restaurantbook.payment.infrastructure.PaymentRepository;
import com.cj.restaurantbook.payment.presentation.dto.ConfirmTossPaymentRequest;
import com.cj.restaurantbook.payment.presentation.dto.ConfirmTossPaymentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomerTossPaymentService {

    private static final String PROVIDER_TOSS = "TOSS";

    private final TossPaymentProperties tossPaymentProperties;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentOrderRepository paymentOrderRepository;
    private final OrderBroadcaster orderBroadcaster;

    @Transactional
    public ConfirmTossPaymentResponse confirm(ConfirmTossPaymentRequest request) {
        Payment existing = paymentRepository
                .findByProviderAndProviderPaymentKeyWithOrders(PROVIDER_TOSS, request.paymentKey())
                .orElse(null);
        if (existing != null) {
            return toResponse(existing);
        }

        if (!tossPaymentProperties.isSecretConfigured()) {
            throw new BusinessException(ErrorCode.PAYMENT_PROVIDER_NOT_CONFIGURED);
        }

        List<Long> orderIds = normalizeOrderIds(request.restaurantOrderIds());
        List<Order> orders = orderIds.stream()
                .map(orderId -> orderRepository.findForUpdateById(orderId)
                        .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND)))
                .sorted(Comparator.comparing(Order::getCreatedAt).thenComparing(Order::getId))
                .toList();

        validateOrders(request.tableName(), orders);
        if (paymentOrderRepository.existsByOrderIdIn(orderIds)) {
            throw new BusinessException(ErrorCode.PAYMENT_ALREADY_EXISTS);
        }

        int expectedAmount = orders.stream().mapToInt(Order::getTotalAmount).sum();
        if (request.amount() != expectedAmount) {
            throw new BusinessException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
        }

        TossConfirmResponse tossResponse = requestTossConfirm(request);
        int approvedAmount = tossResponse.totalAmount() == null ? request.amount() : tossResponse.totalAmount();
        if (approvedAmount != expectedAmount) {
            throw new BusinessException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
        }

        try {
            orders.forEach(Order::complete);
        } catch (IllegalStateException e) {
            throw new BusinessException(ErrorCode.ORDER_STATUS_TRANSITION_NOT_ALLOWED);
        }

        Payment payment = Payment.tossPaid(
                orders,
                expectedAmount,
                resolvePaymentMethod(tossResponse),
                request.paymentKey(),
                request.tossOrderId(),
                resolveProviderMethod(tossResponse),
                tossResponse.receiptUrl(),
                tossResponse.approvedAtInstant()
        );
        Payment saved = paymentRepository.save(payment);
        orders.forEach(order -> orderBroadcaster.broadcastOrderChangedAfterCommit(
                "COMPLETED",
                order.getId(),
                order.getTableName()
        ));
        return toResponse(saved);
    }

    private List<Long> normalizeOrderIds(List<Long> orderIds) {
        if (orderIds == null || orderIds.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED);
        }
        return orderIds.stream().distinct().toList();
    }

    private void validateOrders(String tableName, List<Order> orders) {
        if (orders.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED);
        }
        String normalizedTableName = tableName.trim();
        for (Order order : orders) {
            if (order.getStatus() != OrderStatus.READY) {
                throw new BusinessException(ErrorCode.ORDER_STATUS_TRANSITION_NOT_ALLOWED);
            }
            if (order.getTableName() == null || !order.getTableName().equals(normalizedTableName)) {
                throw new BusinessException(ErrorCode.ORDER_TABLE_MISMATCH);
            }
        }
    }

    private TossConfirmResponse requestTossConfirm(ConfirmTossPaymentRequest request) {
        try {
            RestClient restClient = RestClient.builder()
                    .baseUrl(tossPaymentProperties.apiBaseUrl())
                    .defaultHeader(HttpHeaders.AUTHORIZATION, authorizationHeader())
                    .build();
            TossConfirmResponse response = restClient.post()
                    .uri("/v1/payments/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "paymentKey", request.paymentKey(),
                            "orderId", request.tossOrderId(),
                            "amount", request.amount()
                    ))
                    .retrieve()
                    .body(TossConfirmResponse.class);
            if (response == null) {
                throw new BusinessException(ErrorCode.PAYMENT_PROVIDER_CONFIRM_FAILED);
            }
            return response;
        } catch (RestClientException e) {
            throw new BusinessException(ErrorCode.PAYMENT_PROVIDER_CONFIRM_FAILED);
        }
    }

    private String authorizationHeader() {
        String token = tossPaymentProperties.secretKey() + ":";
        return "Basic " + Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8));
    }

    private PaymentMethod resolvePaymentMethod(TossConfirmResponse response) {
        if (response.easyPay() != null && response.easyPay().provider() != null && !response.easyPay().provider().isBlank()) {
            return PaymentMethod.EASY_PAY;
        }
        return switch (normalize(response.method())) {
            case "카드", "CARD" -> PaymentMethod.CARD;
            case "간편결제", "EASY_PAY" -> PaymentMethod.EASY_PAY;
            case "계좌이체", "TRANSFER" -> PaymentMethod.TRANSFER;
            default -> PaymentMethod.ETC;
        };
    }

    private String resolveProviderMethod(TossConfirmResponse response) {
        if (response.easyPay() != null && response.easyPay().provider() != null && !response.easyPay().provider().isBlank()) {
            return resolveEasyPayProviderLabel(response.easyPay().provider());
        }
        if (response.method() == null || response.method().isBlank()) {
            return null;
        }
        return response.method().trim();
    }

    private String resolveEasyPayProviderLabel(String provider) {
        return switch (normalize(provider)) {
            case "TOSSPAY" -> "토스페이";
            case "NAVERPAY" -> "네이버페이";
            case "SAMSUNGPAY" -> "삼성페이";
            case "APPLEPAY" -> "애플페이";
            case "LPAY" -> "엘페이";
            case "KAKAOPAY" -> "카카오페이";
            case "PINPAY" -> "핀페이";
            case "PAYCO" -> "페이코";
            case "SSG" -> "SSG페이";
            default -> provider.trim();
        };
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }

    private ConfirmTossPaymentResponse toResponse(Payment payment) {
        List<OrderResponse> orders = payment.getPaymentOrders().stream()
                .map(paymentOrder -> OrderResponse.from(paymentOrder.getOrder()))
                .toList();
        return new ConfirmTossPaymentResponse(payment.getId(), payment.getAmount(), orders);
    }

    private record TossConfirmResponse(
            String paymentKey,
            String orderId,
            String method,
            Integer totalAmount,
            String approvedAt,
            Receipt receipt,
            EasyPay easyPay
    ) {
        String receiptUrl() {
            return receipt == null ? null : receipt.url();
        }

        Instant approvedAtInstant() {
            if (approvedAt == null || approvedAt.isBlank()) {
                return Instant.now();
            }
            return OffsetDateTime.parse(approvedAt).toInstant();
        }
    }

    private record Receipt(String url) {
    }

    private record EasyPay(String provider) {
    }
}
