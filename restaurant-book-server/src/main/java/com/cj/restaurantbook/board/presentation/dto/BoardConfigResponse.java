package com.cj.restaurantbook.board.presentation.dto;

import com.cj.restaurantbook.board.domain.BoardConfig;
import com.cj.restaurantbook.board.domain.BoardKind;

import java.time.Instant;

public record BoardConfigResponse(
        Long id,
        String code,
        BoardKind kind,
        String displayName,
        String description,
        boolean allowCustomerWrite,
        boolean allowComment,
        boolean active,
        int sortOrder,
        Instant createdAt,
        Instant updatedAt
) {
    public static BoardConfigResponse from(BoardConfig config) {
        return new BoardConfigResponse(
                config.getId(),
                config.getCode(),
                config.getKind(),
                config.getDisplayName(),
                config.getDescription(),
                config.isAllowCustomerWrite(),
                config.isAllowComment(),
                config.isActive(),
                config.getSortOrder(),
                config.getCreatedAt(),
                config.getUpdatedAt()
        );
    }
}
