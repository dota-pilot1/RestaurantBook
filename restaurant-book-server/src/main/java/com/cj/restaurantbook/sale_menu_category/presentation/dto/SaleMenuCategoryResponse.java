package com.cj.restaurantbook.sale_menu_category.presentation.dto;

import com.cj.restaurantbook.sale_menu_category.domain.SaleMenuCategory;

import java.time.Instant;

public record SaleMenuCategoryResponse(
        Long id,
        String name,
        String description,
        boolean visible,
        int displayOrder,
        Instant createdAt,
        Instant updatedAt
) {
    public static SaleMenuCategoryResponse from(SaleMenuCategory category) {
        return new SaleMenuCategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.isVisible(),
                category.getDisplayOrder(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}
