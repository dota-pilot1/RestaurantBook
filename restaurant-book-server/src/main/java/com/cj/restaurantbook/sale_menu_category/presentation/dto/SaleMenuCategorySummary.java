package com.cj.restaurantbook.sale_menu_category.presentation.dto;

import com.cj.restaurantbook.sale_menu_category.domain.SaleMenuCategory;

public record SaleMenuCategorySummary(
        Long id,
        String name
) {
    public static SaleMenuCategorySummary from(SaleMenuCategory category) {
        if (category == null) {
            return null;
        }
        return new SaleMenuCategorySummary(category.getId(), category.getName());
    }
}
