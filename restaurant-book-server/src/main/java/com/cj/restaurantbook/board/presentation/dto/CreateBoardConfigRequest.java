package com.cj.restaurantbook.board.presentation.dto;

import com.cj.restaurantbook.board.domain.BoardKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateBoardConfigRequest(
        @NotBlank @Pattern(regexp = "^[a-z0-9_-]+$") @Size(max = 100) String code,
        @NotNull BoardKind kind,
        @NotBlank @Size(max = 200) String displayName,
        @Size(max = 500) String description,
        boolean allowCustomerWrite,
        boolean allowComment,
        int sortOrder
) {}
