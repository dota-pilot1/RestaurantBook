package com.cj.restaurantbook.auth.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(
        name = "auth_verifications",
        indexes = {
                @Index(name = "idx_auth_verifications_destination", columnList = "verification_type,destination"),
                @Index(name = "idx_auth_verifications_account_id", columnList = "auth_account_id")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AuthVerification {

    public static final int MAX_ATTEMPT_COUNT = 5;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auth_account_id")
    private AuthAccount authAccount;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_type", nullable = false, length = 30)
    private AuthVerificationType verificationType;

    @Column(nullable = false, length = 255)
    private String destination;

    @Column(nullable = false, length = 255)
    private String codeHash;

    @Column(nullable = false)
    private Instant expiresAt;

    private Instant verifiedAt;

    @Column(nullable = false)
    private int attemptCount;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    public static AuthVerification createEmailSignup(String destination, String codeHash, Instant expiresAt) {
        AuthVerification verification = new AuthVerification();
        verification.verificationType = AuthVerificationType.EMAIL_SIGNUP;
        verification.destination = destination;
        verification.codeHash = codeHash;
        verification.expiresAt = expiresAt;
        verification.attemptCount = 0;
        return verification;
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public boolean hasExceededAttempts() {
        return attemptCount >= MAX_ATTEMPT_COUNT;
    }

    public void recordFailedAttempt() {
        this.attemptCount++;
    }

    public void markVerified() {
        this.verifiedAt = Instant.now();
    }
}
