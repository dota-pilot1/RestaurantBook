package com.cj.restaurantbook.sale_menu_set.presentation.dto;

import com.cj.restaurantbook.sale_menu.domain.SaleMenuStatus;
import com.cj.restaurantbook.sale_menu_set.domain.SaleMenuSet;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

public record SaleMenuSetResponse(
        Long id,
        String name,
        String description,
        int price,
        String imageUrl,
        SaleMenuStatus status,
        boolean visible,
        boolean availableDineIn,
        boolean availableTakeout,
        int displayOrder,
        List<SaleMenuSetItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {
    public static SaleMenuSetResponse from(SaleMenuSet set) {
        List<SaleMenuSetItemResponse> itemResponses = set.getItems().stream()
                .sorted(Comparator.comparingInt(item -> item.getDisplayOrder()))
                .map(SaleMenuSetItemResponse::from)
                .toList();

        return new SaleMenuSetResponse(
                set.getId(),
                set.getName(),
                set.getDescription(),
                set.getPrice(),
                set.getImageUrl(),
                set.getStatus(),
                set.isVisible(),
                set.isAvailableDineIn(),
                set.isAvailableTakeout(),
                set.getDisplayOrder(),
                itemResponses,
                set.getCreatedAt(),
                set.getUpdatedAt()
        );
    }
}
