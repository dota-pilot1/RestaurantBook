package com.cj.restaurantbook.board.presentation.dto;

import com.cj.restaurantbook.board.domain.Board;
import com.cj.restaurantbook.board.domain.BoardStatus;

import java.time.Instant;

public record BoardDetailResponse(
        Long id,
        String boardCode,
        String title,
        String content,
        String authorName,
        BoardStatus status,
        boolean canEdit,
        boolean pinned,
        boolean answered,
        int viewCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static BoardDetailResponse from(Board board, boolean canEdit) {
        return new BoardDetailResponse(
                board.getId(),
                board.getBoardConfig().getCode(),
                board.getTitle(),
                board.getContent(),
                board.getAuthorName(),
                board.getStatus(),
                canEdit,
                board.isPinned(),
                board.isAnswered(),
                board.getViewCount(),
                board.getCreatedAt(),
                board.getUpdatedAt()
        );
    }
}
