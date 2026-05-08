package com.cj.restaurantbook.board.presentation.dto;

import com.cj.restaurantbook.board.domain.BoardComment;

import java.time.Instant;

public record BoardCommentResponse(
        Long id,
        Long boardId,
        String authorName,
        String content,
        boolean adminReply,
        Instant createdAt,
        Instant updatedAt
) {
    public static BoardCommentResponse from(BoardComment comment) {
        return new BoardCommentResponse(
                comment.getId(),
                comment.getBoard().getId(),
                comment.getAuthorName(),
                comment.getContent(),
                comment.isAdminReply(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }
}
