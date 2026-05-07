package com.cj.restaurantbook.restaurant_table.presentation.dto;

import com.cj.restaurantbook.restaurant_table.domain.RestaurantTable;

import java.time.Instant;

public record RestaurantTableResponse(
        Long id,
        String name,
        boolean active,
        int displayOrder,
        Instant createdAt,
        Instant updatedAt
) {
    public static RestaurantTableResponse from(RestaurantTable table) {
        return new RestaurantTableResponse(
                table.getId(),
                table.getName(),
                table.isActive(),
                table.getDisplayOrder(),
                table.getCreatedAt(),
                table.getUpdatedAt()
        );
    }
}
