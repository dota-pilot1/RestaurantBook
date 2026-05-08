package com.cj.restaurantbook.staff_call.presentation.dto;

import com.cj.restaurantbook.staff_call.domain.StaffCall;
import com.cj.restaurantbook.staff_call.domain.StaffCallStatus;
import com.cj.restaurantbook.staff_call.domain.StaffCallType;

import java.time.Instant;

public record StaffCallResponse(
        Long id,
        String tableName,
        StaffCallType type,
        String message,
        StaffCallStatus status,
        Instant acknowledgedAt,
        Long acknowledgedBy,
        Instant createdAt,
        Instant updatedAt
) {
    public static StaffCallResponse from(StaffCall call) {
        return new StaffCallResponse(
                call.getId(),
                call.getTableName(),
                call.getType(),
                call.getMessage(),
                call.getStatus(),
                call.getAcknowledgedAt(),
                call.getAcknowledgedBy(),
                call.getCreatedAt(),
                call.getUpdatedAt()
        );
    }
}
