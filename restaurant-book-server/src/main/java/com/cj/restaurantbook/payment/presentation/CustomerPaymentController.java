package com.cj.restaurantbook.payment.presentation;

import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import com.cj.restaurantbook.payment.application.CustomerTossPaymentService;
import com.cj.restaurantbook.payment.application.TossPaymentProperties;
import com.cj.restaurantbook.payment.presentation.dto.ConfirmTossPaymentRequest;
import com.cj.restaurantbook.payment.presentation.dto.ConfirmTossPaymentResponse;
import com.cj.restaurantbook.payment.presentation.dto.TossPaymentConfigResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customer/payments")
@RequiredArgsConstructor
public class CustomerPaymentController {

    private final TossPaymentProperties tossPaymentProperties;
    private final CustomerTossPaymentService customerTossPaymentService;

    @GetMapping("/config")
    public TossPaymentConfigResponse config() {
        if (!tossPaymentProperties.isClientConfigured()) {
            throw new BusinessException(ErrorCode.PAYMENT_PROVIDER_NOT_CONFIGURED);
        }
        return new TossPaymentConfigResponse(tossPaymentProperties.clientKey());
    }

    @PostMapping("/toss/confirm")
    public ConfirmTossPaymentResponse confirm(@Valid @RequestBody ConfirmTossPaymentRequest request) {
        return customerTossPaymentService.confirm(request);
    }
}
