package com.cj.restaurantbook.sale_menu.presentation.dto;

import com.cj.restaurantbook.sale_menu.domain.SaleMenuStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateSaleMenuRequest(
        @NotNull
        Long categoryId,

        @NotBlank
        @Size(max = 100)
        String name,

        @Size(max = 500)
        String description,

        @Min(0)
        int price,

        @Size(max = 1024)
        String imageUrl,

        @NotNull
        SaleMenuStatus status,

        boolean visible,

        boolean availableDineIn,

        boolean availableTakeout,

        Boolean requiresCooking,

        @Min(0)
        int displayOrder
) {
}
