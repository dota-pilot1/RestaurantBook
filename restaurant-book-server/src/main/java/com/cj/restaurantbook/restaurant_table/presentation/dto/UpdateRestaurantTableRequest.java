package com.cj.restaurantbook.restaurant_table.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateRestaurantTableRequest(
        @NotBlank @Size(max = 100) String name,
        boolean active,
        int displayOrder
) {}
