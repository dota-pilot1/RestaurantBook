package com.cj.restaurantbook.sale_menu_set.presentation.dto;

import com.cj.restaurantbook.sale_menu.domain.SaleMenu;
import com.cj.restaurantbook.sale_menu_set.domain.SaleMenuSetItem;

public record SaleMenuSetItemResponse(
        Long id,
        SaleMenuSummary saleMenu,
        int quantity,
        int displayOrder
) {
    public static SaleMenuSetItemResponse from(SaleMenuSetItem item) {
        return new SaleMenuSetItemResponse(
                item.getId(),
                SaleMenuSummary.from(item.getSaleMenu()),
                item.getQuantity(),
                item.getDisplayOrder()
        );
    }

    public record SaleMenuSummary(
            Long id,
            String name,
            int price
    ) {
        public static SaleMenuSummary from(SaleMenu menu) {
            return new SaleMenuSummary(menu.getId(), menu.getName(), menu.getPrice());
        }
    }
}
