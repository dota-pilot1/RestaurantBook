package com.cj.restaurantbook.customer_menu.presentation.dto;

import com.cj.restaurantbook.customer_menu.domain.SaleProductType;
import com.cj.restaurantbook.sale_menu.domain.SaleMenu;
import com.cj.restaurantbook.sale_menu.domain.SaleMenuStatus;
import com.cj.restaurantbook.sale_menu_category.presentation.dto.SaleMenuCategorySummary;
import com.cj.restaurantbook.sale_menu_set.domain.SaleMenuSet;

import java.util.Comparator;
import java.util.List;

public record CustomerSaleProductResponse(
        SaleProductType type,
        Long id,
        SaleMenuCategorySummary category,
        String name,
        String description,
        int price,
        String imageUrl,
        SaleMenuStatus status,
        int displayOrder,
        List<CustomerSaleProductComponentResponse> components,
        CustomerSaleProductDetailResponse detail,
        CustomerSaleProductNutritionResponse nutrition
) {
    public static CustomerSaleProductResponse fromSaleMenu(SaleMenu menu) {
        return new CustomerSaleProductResponse(
                SaleProductType.SALE_MENU,
                menu.getId(),
                SaleMenuCategorySummary.from(menu.getCategory()),
                menu.getName(),
                menu.getDescription(),
                menu.getPrice(),
                menu.getImageUrl(),
                menu.getStatus(),
                menu.getDisplayOrder(),
                List.of(),
                new CustomerSaleProductDetailResponse(
                        menu.getDetailDescription(),
                        menu.getIngredients(),
                        menu.getAllergens()
                ),
                new CustomerSaleProductNutritionResponse(
                        menu.getCaloriesKcal(),
                        menu.getCarbohydrateG(),
                        menu.getProteinG(),
                        menu.getFatG(),
                        menu.getSodiumMg()
                )
        );
    }

    public static CustomerSaleProductResponse fromSaleMenuSet(SaleMenuSet set) {
        List<CustomerSaleProductComponentResponse> components = set.getItems().stream()
                .sorted(Comparator.comparingInt(item -> item.getDisplayOrder()))
                .map(item -> new CustomerSaleProductComponentResponse(
                        item.getSaleMenu().getName(),
                        item.getQuantity()
                ))
                .toList();

        return new CustomerSaleProductResponse(
                SaleProductType.SALE_MENU_SET,
                set.getId(),
                null,
                set.getName(),
                set.getDescription(),
                set.getPrice(),
                set.getImageUrl(),
                set.getStatus(),
                set.getDisplayOrder(),
                components,
                new CustomerSaleProductDetailResponse(
                        set.getDetailDescription(),
                        set.getIngredients(),
                        set.getAllergens()
                ),
                new CustomerSaleProductNutritionResponse(
                        set.getCaloriesKcal(),
                        set.getCarbohydrateG(),
                        set.getProteinG(),
                        set.getFatG(),
                        set.getSodiumMg()
                )
        );
    }
}
