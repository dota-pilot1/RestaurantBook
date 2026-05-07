package com.cj.restaurantbook.navigation_menu.presentation.dto;

import com.cj.restaurantbook.navigation_menu.domain.NavigationMenu;

import java.time.Instant;

public record NavigationMenuResponse(
        Long id,
        String code,
        Long parentId,
        String label,
        String labelKey,
        String path,
        String icon,
        boolean isExternal,
        String requiredRole,
        String requiredPermission,
        boolean visible,
        int displayOrder,
        Instant createdAt,
        Instant updatedAt
) {
    public static NavigationMenuResponse from(NavigationMenu m) {
        return new NavigationMenuResponse(
                m.getId(),
                m.getCode(),
                m.getParent() != null ? m.getParent().getId() : null,
                m.getLabel(),
                m.getLabelKey(),
                m.getPath(),
                m.getIcon(),
                m.isExternal(),
                m.getRequiredRole(),
                m.getRequiredPermission(),
                m.isVisible(),
                m.getDisplayOrder(),
                m.getCreatedAt(),
                m.getUpdatedAt()
        );
    }
}
