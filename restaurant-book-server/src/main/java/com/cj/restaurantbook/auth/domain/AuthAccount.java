package com.cj.restaurantbook.auth.domain;

import com.cj.restaurantbook.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(
        name = "auth_accounts",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_auth_accounts_provider_identifier",
                columnNames = {"provider_type", "identifier"}
        ),
        indexes = @Index(name = "idx_auth_accounts_user_id", columnList = "user_id")
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AuthAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider_type", nullable = false, length = 20)
    private AuthProviderType providerType;

    @Column(nullable = false, length = 255)
    private String identifier;

    @Column(length = 255)
    private String passwordHash;

    @Column(nullable = false)
    private boolean verified;

    private Instant verifiedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static AuthAccount createEmail(User user, String email, String passwordHash, boolean verified) {
        AuthAccount account = new AuthAccount();
        account.user = user;
        account.providerType = AuthProviderType.EMAIL;
        account.identifier = email;
        account.passwordHash = passwordHash;
        account.verified = verified;
        account.verifiedAt = verified ? Instant.now() : null;
        user.addAuthAccount(account);
        return account;
    }

    public void changeIdentifier(String identifier) {
        this.identifier = identifier;
    }
}
