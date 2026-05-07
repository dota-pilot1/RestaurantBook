package com.cj.restaurantbook.auth.application;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "auth.email-verification")
public class EmailVerificationProperties {
    private long codeTtlSeconds = 300;
    private long verifiedTokenTtlSeconds = 600;
    private String subject = "RestaurantBook email verification code";
    private String from = "";
    private boolean logOnly = false;
    private String devBypassCode = "1234";
}
