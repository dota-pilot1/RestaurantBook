package com.cj.restaurantbook.user.presentation.dto;

import com.cj.restaurantbook.role.presentation.dto.RoleSummary;
import com.cj.restaurantbook.user.domain.User;

import java.time.Instant;

public record SignupResponse(
        Long id,
        String email,
        String username,
        RoleSummary role,
        Instant createdAt
) {
    public static SignupResponse from(User u) {
        return from(u, u.getEmail());
    }

    public static SignupResponse from(User u, String email) {
        return new SignupResponse(u.getId(), email, u.getUsername(), RoleSummary.from(u.getRole()), u.getCreatedAt());
    }
}
