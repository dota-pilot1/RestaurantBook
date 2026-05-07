package com.cj.restaurantbook.sale_menu_category.presentation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSaleMenuCategoryRequest(
        @NotBlank
        @Size(max = 100)
        String name,

        @Size(max = 255)
        String description,

        boolean visible,

        @Min(0)
        int displayOrder
) {
}
