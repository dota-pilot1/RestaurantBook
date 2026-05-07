package com.cj.restaurantbook.auth.infrastructure;

import com.cj.restaurantbook.auth.domain.AuthAccount;
import com.cj.restaurantbook.auth.domain.AuthProviderType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthAccountRepository extends JpaRepository<AuthAccount, Long> {
    @EntityGraph(attributePaths = {"user", "user.role", "user.role.permissions"})
    Optional<AuthAccount> findByProviderTypeAndIdentifier(AuthProviderType providerType, String identifier);

    Optional<AuthAccount> findFirstByUserIdAndProviderTypeOrderByIdAsc(Long userId, AuthProviderType providerType);

    boolean existsByProviderTypeAndIdentifier(AuthProviderType providerType, String identifier);
}
