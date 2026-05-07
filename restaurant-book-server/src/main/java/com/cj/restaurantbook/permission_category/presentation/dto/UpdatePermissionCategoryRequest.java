package com.cj.restaurantbook.permission_category.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdatePermissionCategoryRequest(
        @NotBlank @Size(max = 80)
        String name,

        @Size(max = 255)
        String description
) {}
