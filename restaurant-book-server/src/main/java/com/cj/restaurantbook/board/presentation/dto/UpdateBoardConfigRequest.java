package com.cj.restaurantbook.board.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateBoardConfigRequest(
        @NotBlank @Size(max = 200) String displayName,
        @Size(max = 500) String description,
        boolean allowCustomerWrite,
        boolean allowComment,
        boolean active,
        int sortOrder
) {}
