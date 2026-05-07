package com.cj.restaurantbook.sale_menu.presentation.dto;

import com.cj.restaurantbook.sale_menu.domain.SaleMenu;
import com.cj.restaurantbook.sale_menu.domain.SaleMenuStatus;
import com.cj.restaurantbook.sale_menu_category.presentation.dto.SaleMenuCategorySummary;

import java.time.Instant;

public record SaleMenuResponse(
        Long id,
        SaleMenuCategorySummary category,
        String name,
        String description,
        int price,
        String imageUrl,
        SaleMenuStatus status,
        boolean visible,
        boolean availableDineIn,
        boolean availableTakeout,
        int displayOrder,
        Instant createdAt,
        Instant updatedAt
) {
    public static SaleMenuResponse from(SaleMenu menu) {
        return new SaleMenuResponse(
                menu.getId(),
                SaleMenuCategorySummary.from(menu.getCategory()),
                menu.getName(),
                menu.getDescription(),
                menu.getPrice(),
                menu.getImageUrl(),
                menu.getStatus(),
                menu.isVisible(),
                menu.isAvailableDineIn(),
                menu.isAvailableTakeout(),
                menu.getDisplayOrder(),
                menu.getCreatedAt(),
                menu.getUpdatedAt()
        );
    }
}
