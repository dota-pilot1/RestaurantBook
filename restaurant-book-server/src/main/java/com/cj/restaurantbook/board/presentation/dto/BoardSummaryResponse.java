package com.cj.restaurantbook.board.presentation.dto;

import com.cj.restaurantbook.board.domain.Board;
import com.cj.restaurantbook.board.domain.BoardStatus;

import java.time.Instant;

public record BoardSummaryResponse(
        Long id,
        String boardCode,
        String title,
        String authorName,
        BoardStatus status,
        boolean pinned,
        boolean answered,
        int viewCount,
        Instant createdAt
) {
    public static BoardSummaryResponse from(Board board) {
        return new BoardSummaryResponse(
                board.getId(),
                board.getBoardConfig().getCode(),
                board.getTitle(),
                board.getAuthorName(),
                board.getStatus(),
                board.isPinned(),
                board.isAnswered(),
                board.getViewCount(),
                board.getCreatedAt()
        );
    }
}
