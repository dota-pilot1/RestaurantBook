package com.cj.restaurantbook.sale_menu_set.presentation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record SaleMenuSetItemRequest(
        @NotNull
        Long saleMenuId,

        @Min(1)
        int quantity,

        @Min(0)
        int displayOrder
) {
}
