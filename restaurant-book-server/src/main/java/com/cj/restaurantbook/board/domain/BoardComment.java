package com.cj.restaurantbook.board.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "board_comments", indexes = {
        @Index(name = "idx_board_comments_board_deleted", columnList = "board_id,deleted_at")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BoardComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @Column
    private Long authorId;

    @Column(nullable = false, length = 200)
    private String authorName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private boolean adminReply;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    @Column
    private Instant deletedAt;

    public static BoardComment createAdminReply(Board board, Long adminId, String adminName, String content) {
        BoardComment comment = new BoardComment();
        comment.board = board;
        comment.authorId = adminId;
        comment.authorName = adminName;
        comment.content = content;
        comment.adminReply = true;
        return comment;
    }

    public static BoardComment create(Board board, Long authorId, String authorName, String content) {
        BoardComment comment = new BoardComment();
        comment.board = board;
        comment.authorId = authorId;
        comment.authorName = authorName;
        comment.content = content;
        comment.adminReply = false;
        return comment;
    }

    public void update(String content) {
        this.content = content;
    }

    public void softDelete() {
        this.deletedAt = Instant.now();
    }
}
