package com.cj.restaurantbook.staff_call.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelStaffCallRequest(
        @NotBlank @Size(max = 80) String tableName
) {
}
