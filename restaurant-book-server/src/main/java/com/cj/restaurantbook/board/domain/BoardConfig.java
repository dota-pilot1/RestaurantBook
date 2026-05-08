package com.cj.restaurantbook.board.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "board_configs", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BoardConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100, unique = true)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BoardKind kind;

    @Column(nullable = false, length = 200)
    private String displayName;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private boolean allowCustomerWrite;

    @Column(nullable = false)
    private boolean allowComment;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private int sortOrder;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static BoardConfig create(
            String code,
            BoardKind kind,
            String displayName,
            String description,
            boolean allowCustomerWrite,
            boolean allowComment,
            int sortOrder) {
        BoardConfig config = new BoardConfig();
        config.code = code;
        config.kind = kind;
        config.displayName = displayName;
        config.description = description;
        config.allowCustomerWrite = allowCustomerWrite;
        config.allowComment = allowComment;
        config.active = true;
        config.sortOrder = sortOrder;
        return config;
    }

    public void update(
            String displayName,
            String description,
            boolean allowCustomerWrite,
            boolean allowComment,
            boolean active,
            int sortOrder) {
        this.displayName = displayName;
        this.description = description;
        this.allowCustomerWrite = allowCustomerWrite;
        this.allowComment = allowComment;
        this.active = active;
        this.sortOrder = sortOrder;
    }

    public void deactivate() {
        this.active = false;
    }
}
