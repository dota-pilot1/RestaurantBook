package com.cj.restaurantbook.staff_call.presentation.dto;

import com.cj.restaurantbook.staff_call.domain.StaffCallType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateStaffCallRequest(
        @NotBlank @Size(max = 80) String tableName,
        StaffCallType type,
        @Size(max = 200) String message
) {
}
