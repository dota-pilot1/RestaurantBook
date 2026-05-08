package com.cj.restaurantbook.user.presentation.dto;

import com.cj.restaurantbook.role.presentation.dto.RoleSummary;
import com.cj.restaurantbook.user.domain.User;

import java.time.Instant;
import java.util.List;

public record UserSummary(
        Long id,
        String email,
        String username,
        String profileImageUrl,
        RoleSummary role,
        List<String> permissions,
        Instant createdAt
) {
    public static UserSummary from(User u) {
        return from(u, u.getEmail());
    }

    public static UserSummary from(User u, String email) {
        List<String> permCodes = u.getRole().getPermissions()
                .stream().map(p -> p.getCode()).toList();
        return new UserSummary(
                u.getId(),
                email,
                u.getUsername(),
                u.getProfileImageUrl(),
                RoleSummary.from(u.getRole()),
                permCodes,
                u.getCreatedAt()
        );
    }
}
