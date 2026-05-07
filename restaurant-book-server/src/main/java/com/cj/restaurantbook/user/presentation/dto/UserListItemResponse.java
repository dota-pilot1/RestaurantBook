package com.cj.restaurantbook.user.presentation.dto;

import com.cj.restaurantbook.role.presentation.dto.RoleSummary;
import com.cj.restaurantbook.user.domain.User;

import java.time.Instant;

public record UserListItemResponse(
        Long id,
        String email,
        String username,
        RoleSummary role,
        boolean active,
        Instant createdAt
) {
    public static UserListItemResponse from(User u) {
        return from(u, u.getEmail());
    }

    public static UserListItemResponse from(User u, String email) {
        return new UserListItemResponse(
                u.getId(),
                email,
                u.getUsername(),
                RoleSummary.from(u.getRole()),
                u.isActive(),
                u.getCreatedAt()
        );
    }
}
