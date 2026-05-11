package com.cj.restaurantbook.customer_menu.presentation.dto;

public record CustomerSaleProductNutritionResponse(
        Integer caloriesKcal,
        Integer carbohydrateG,
        Integer proteinG,
        Integer fatG,
        Integer sodiumMg
) {
}

