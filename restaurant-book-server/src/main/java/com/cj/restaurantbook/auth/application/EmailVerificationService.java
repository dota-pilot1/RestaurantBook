package com.cj.restaurantbook.auth.application;

import com.cj.restaurantbook.auth.domain.AuthProviderType;
import com.cj.restaurantbook.auth.domain.AuthVerification;
import com.cj.restaurantbook.auth.domain.AuthVerificationType;
import com.cj.restaurantbook.auth.infrastructure.AuthAccountRepository;
import com.cj.restaurantbook.auth.infrastructure.AuthVerificationRepository;
import com.cj.restaurantbook.auth.jwt.JwtTokenProvider;
import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.DuplicateEmailException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final AuthAccountRepository authAccountRepository;
    private final AuthVerificationRepository authVerificationRepository;
    private final EmailVerificationSender emailVerificationSender;
    private final EmailVerificationProperties properties;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public void sendSignupCode(String email) {
        String normalizedEmail = normalizeEmail(email);
        if (authAccountRepository.existsByProviderTypeAndIdentifier(AuthProviderType.EMAIL, normalizedEmail)) {
            throw new DuplicateEmailException();
        }

        String code = generateCode();
        String codeHash = passwordEncoder.encode(code);
        Instant expiresAt = Instant.now().plusSeconds(properties.getCodeTtlSeconds());
        authVerificationRepository.save(AuthVerification.createEmailSignup(normalizedEmail, codeHash, expiresAt));
        emailVerificationSender.sendCode(normalizedEmail, code);
    }

    @Transactional(noRollbackFor = BusinessException.class)
    public String verifySignupCode(String email, String code) {
        String normalizedEmail = normalizeEmail(email);
        AuthVerification verification = authVerificationRepository
                .findFirstByVerificationTypeAndDestinationAndVerifiedAtIsNullOrderByCreatedAtDesc(
                        AuthVerificationType.EMAIL_SIGNUP,
                        normalizedEmail
                )
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_EMAIL_CODE));

        if (verification.isExpired()) {
            throw new BusinessException(ErrorCode.EMAIL_CODE_EXPIRED);
        }
        if (verification.hasExceededAttempts()) {
            throw new BusinessException(ErrorCode.INVALID_EMAIL_CODE);
        }
        if (!isDevBypassCode(code) && !passwordEncoder.matches(code, verification.getCodeHash())) {
            verification.recordFailedAttempt();
            throw new BusinessException(ErrorCode.INVALID_EMAIL_CODE);
        }

        verification.markVerified();
        return jwtTokenProvider.generateEmailVerificationToken(
                AuthProviderType.EMAIL,
                normalizedEmail,
                properties.getVerifiedTokenTtlSeconds() * 1000
        );
    }

    public long getVerifiedTokenTtlSeconds() {
        return properties.getVerifiedTokenTtlSeconds();
    }

    private String generateCode() {
        return "%06d".formatted(RANDOM.nextInt(1_000_000));
    }

    private boolean isDevBypassCode(String code) {
        return StringUtils.hasText(properties.getDevBypassCode())
                && properties.getDevBypassCode().equals(code);
    }

    public String normalizeEmail(String email) {
        return email.toLowerCase(Locale.ROOT).trim();
    }
}
