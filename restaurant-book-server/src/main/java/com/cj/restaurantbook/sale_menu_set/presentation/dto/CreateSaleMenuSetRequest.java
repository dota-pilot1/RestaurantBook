package com.cj.restaurantbook.sale_menu_set.presentation.dto;

import com.cj.restaurantbook.sale_menu.domain.SaleMenuStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateSaleMenuSetRequest(
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

        @Min(0)
        int displayOrder,

        @Valid
        @NotEmpty
        List<SaleMenuSetItemRequest> items
) {
}
