package com.cj.restaurantbook.payment.application;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "toss-payments")
public record TossPaymentProperties(
        String clientKey,
        String secretKey,
        String apiBaseUrl
) {
    public String apiBaseUrl() {
        return isBlank(apiBaseUrl) ? "https://api.tosspayments.com" : apiBaseUrl;
    }

    public boolean isClientConfigured() {
        return !isBlank(clientKey);
    }

    public boolean isSecretConfigured() {
        return !isBlank(secretKey);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
