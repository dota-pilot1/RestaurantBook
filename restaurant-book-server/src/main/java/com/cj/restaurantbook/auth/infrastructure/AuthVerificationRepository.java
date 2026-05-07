package com.cj.restaurantbook.auth.infrastructure;

import com.cj.restaurantbook.auth.domain.AuthVerification;
import com.cj.restaurantbook.auth.domain.AuthVerificationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthVerificationRepository extends JpaRepository<AuthVerification, Long> {
    Optional<AuthVerification> findFirstByVerificationTypeAndDestinationAndVerifiedAtIsNullOrderByCreatedAtDesc(
            AuthVerificationType verificationType,
            String destination
    );
}
