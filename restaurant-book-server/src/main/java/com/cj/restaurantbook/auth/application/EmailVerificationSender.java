package com.cj.restaurantbook.auth.application;

import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationSender {

    private final JavaMailSender mailSender;
    private final EmailVerificationProperties properties;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public void sendCode(String email, String code) {
        String from = StringUtils.hasText(properties.getFrom()) ? properties.getFrom() : mailUsername;
        if (properties.isLogOnly() || shouldUseDevBypassWithoutSmtp(from)) {
            log.info("Email verification code log-only mode. destination={}, code={}, ttlSeconds={}",
                    email,
                    code,
                    properties.getCodeTtlSeconds());
            return;
        }

        if (!StringUtils.hasText(from)) {
            throw new BusinessException(ErrorCode.MAIL_NOT_CONFIGURED);
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject(properties.getSubject());
        message.setText("""
                RestaurantBook 이메일 인증코드입니다.

                인증코드: %s

                인증코드는 %d분 동안 유효합니다.
                """.formatted(code, Math.max(1, properties.getCodeTtlSeconds() / 60)));
        mailSender.send(message);
    }

    private boolean shouldUseDevBypassWithoutSmtp(String from) {
        return StringUtils.hasText(properties.getDevBypassCode()) && !StringUtils.hasText(from);
    }
}
