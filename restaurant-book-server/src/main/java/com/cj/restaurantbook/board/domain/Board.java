package com.cj.restaurantbook.board.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "boards", indexes = {
        @Index(name = "idx_boards_config_status_deleted", columnList = "board_config_id,status,deleted_at"),
        @Index(name = "idx_boards_pinned_order", columnList = "pinned,pinned_order")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Board {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "board_config_id", nullable = false)
    private BoardConfig boardConfig;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column
    private Long authorId;

    @Column(nullable = false, length = 200)
    private String authorName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BoardStatus status = BoardStatus.PUBLISHED;

    @Column(nullable = false)
    private boolean pinned = false;

    @Column
    private Integer pinnedOrder;

    @Column(nullable = false)
    private boolean answered = false;

    @Column(nullable = false)
    private int viewCount = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    @Column
    private Instant deletedAt;

    public static Board create(
            BoardConfig boardConfig,
            String title,
            String content,
            Long authorId,
            String authorName,
            BoardStatus status) {
        Board board = new Board();
        board.boardConfig = boardConfig;
        board.title = title;
        board.content = content;
        board.authorId = authorId;
        board.authorName = authorName;
        board.status = status != null ? status : BoardStatus.PUBLISHED;
        return board;
    }

    public void update(String title, String content, BoardStatus status) {
        this.title = title;
        this.content = content;
        if (status != null) {
            this.status = status;
        }
    }

    public void publish() {
        this.status = BoardStatus.PUBLISHED;
    }

    public void hide() {
        this.status = BoardStatus.HIDDEN;
    }

    public void pin(int order) {
        this.pinned = true;
        this.pinnedOrder = order;
    }

    public void unpin() {
        this.pinned = false;
        this.pinnedOrder = null;
    }

    public void incrementView() {
        this.viewCount++;
    }

    public void markAnswered() {
        this.answered = true;
    }

    public void markUnanswered() {
        this.answered = false;
    }

    public void softDelete() {
        this.deletedAt = Instant.now();
    }

    public boolean isAuthor(Long userId) {
        return userId != null && authorId != null && authorId.equals(userId);
    }
}
