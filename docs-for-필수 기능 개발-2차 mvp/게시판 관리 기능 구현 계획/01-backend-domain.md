# 01-backend-domain

`board/` 도메인 패키지의 엔티티, enum, Repository를 정의한다.

## 패키지 구조

```
restaurant-book-server/src/main/java/com/cj/restaurantbook/board/
├── domain/
│   ├── Board.java
│   ├── BoardConfig.java
│   ├── BoardComment.java
│   ├── BoardKind.java         (enum)
│   ├── BoardStatus.java       (enum)
│   └── exception/
│       ├── BoardNotFoundException.java
│       ├── BoardConfigNotFoundException.java
│       ├── GuestPasswordMismatchException.java
│       └── BoardWriteForbiddenException.java
├── application/
│   ├── BoardService.java
│   └── BoardConfigService.java
├── infrastructure/
│   ├── BoardRepository.java
│   ├── BoardConfigRepository.java
│   └── BoardCommentRepository.java
└── presentation/
    └── (02-backend-api.md 에서 다룸)
```

## enum

### BoardKind

```java
package com.cj.restaurantbook.board.domain;

public enum BoardKind {
    NOTICE,    // 공지사항 (관리자만 작성)
    INQUIRY,   // 문의 게시판 (익명 작성 가능)
    FAQ,       // (예약 — MVP에서는 시드 안 함)
    EVENT      // (예약)
}
```

`BoardKind`는 게시판의 성격을 분류하는 메타데이터. 정책(작성 권한, 댓글 허용 등)은 `BoardConfig`의 boolean 플래그로 표현. enum은 향후 UI에서 아이콘/색상 매핑용으로 활용.

### BoardStatus

```java
public enum BoardStatus {
    PUBLISHED,  // 게시됨
    HIDDEN,     // 숨김 (관리자가 강제 숨김 처리)
    DRAFT       // 임시 저장 (관리자 작성 중)
}
```

`deletedAt`은 별도 컬럼으로 soft delete (BoardStatus에 DELETED를 두지 않는 이유: 상태와 삭제는 직교).

## 엔티티

### BoardConfig

```java
package com.cj.restaurantbook.board.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "board_configs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BoardConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    private String code;            // URL 슬러그. 예: "notice", "inquiry"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BoardKind kind;

    @Column(nullable = false, length = 200)
    private String displayName;     // "공지사항", "문의 게시판"

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private boolean allowCustomerWrite;  // false=관리자만, true=익명/고객 작성 가능

    @Column(nullable = false)
    private boolean allowComment;        // 댓글 허용 여부

    @Column(nullable = false)
    private boolean isActive = true;

    @Column(nullable = false)
    private int sortOrder;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static BoardConfig create(String code, BoardKind kind, String displayName,
                                     String description, boolean allowCustomerWrite,
                                     boolean allowComment, int sortOrder) {
        BoardConfig c = new BoardConfig();
        c.code = code;
        c.kind = kind;
        c.displayName = displayName;
        c.description = description;
        c.allowCustomerWrite = allowCustomerWrite;
        c.allowComment = allowComment;
        c.sortOrder = sortOrder;
        c.isActive = true;
        return c;
    }

    public void update(String displayName, String description, boolean allowCustomerWrite,
                       boolean allowComment, boolean isActive, int sortOrder) {
        this.displayName = displayName;
        this.description = description;
        this.allowCustomerWrite = allowCustomerWrite;
        this.allowComment = allowComment;
        this.isActive = isActive;
        this.sortOrder = sortOrder;
    }

    public void deactivate() {
        this.isActive = false;
    }
}
```

### Board

```java
@Entity
@Table(name = "boards", indexes = {
    @Index(name = "idx_boards_config_status", columnList = "board_config_id,status,deleted_at"),
    @Index(name = "idx_boards_pinned", columnList = "is_pinned,pinned_order"),
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Board {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_config_id", nullable = false)
    private BoardConfig boardConfig;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // 작성자 정보 — 익명 작성 시 authorId=null
    @Column
    private Long authorId;

    @Column(nullable = false, length = 200)
    private String authorName;

    @Column(length = 100)
    private String authorContact;       // 익명 작성 시 필수 (전화/이메일)

    @Column(length = 200)
    private String guestPasswordHash;   // 익명 작성 시 필수 (BCrypt). 로그인 작성 시 null.

    @Column
    private Long tableId;               // 테이블 익명 고객이면 자동 부착, 그 외 null

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BoardStatus status = BoardStatus.PUBLISHED;

    @Column(nullable = false)
    private boolean isPinned = false;

    @Column
    private Integer pinnedOrder;        // 핀 고정 순서 (작을수록 위)

    @Column(nullable = false)
    private boolean isAnswered = false; // 문의 게시판 — 관리자가 댓글(답변) 달면 true

    @Column(nullable = false)
    private int viewCount = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    @Column
    private Instant deletedAt;          // soft delete

    // ─── factory ───

    /** 로그인 사용자(관리자 또는 회원)의 게시글 */
    public static Board createByMember(BoardConfig config, String title, String content,
                                       Long authorId, String authorName) {
        Board b = new Board();
        b.boardConfig = config;
        b.title = title;
        b.content = content;
        b.authorId = authorId;
        b.authorName = authorName;
        b.status = BoardStatus.PUBLISHED;
        return b;
    }

    /** 익명 고객의 게시글 (문의 등) */
    public static Board createByGuest(BoardConfig config, String title, String content,
                                      String authorName, String authorContact,
                                      String guestPasswordHash, Long tableId) {
        Board b = new Board();
        b.boardConfig = config;
        b.title = title;
        b.content = content;
        b.authorName = authorName;
        b.authorContact = authorContact;
        b.guestPasswordHash = guestPasswordHash;
        b.tableId = tableId;
        b.status = BoardStatus.PUBLISHED;
        return b;
    }

    // ─── domain ops ───

    public void update(String title, String content) {
        this.title = title;
        this.content = content;
    }

    public void hide()    { this.status = BoardStatus.HIDDEN; }
    public void publish() { this.status = BoardStatus.PUBLISHED; }

    public void pin(int order) { this.isPinned = true; this.pinnedOrder = order; }
    public void unpin()        { this.isPinned = false; this.pinnedOrder = null; }

    public void incrementViewCount() { this.viewCount++; }
    public void markAnswered()       { this.isAnswered = true; }
    public void markUnanswered()     { this.isAnswered = false; }

    public void softDelete()  { this.deletedAt = Instant.now(); }
    public boolean isDeleted() { return deletedAt != null; }

    public boolean isGuestPost() { return authorId == null; }
}
```

### BoardComment

```java
@Entity
@Table(name = "board_comments", indexes = {
    @Index(name = "idx_comments_board", columnList = "board_id,deleted_at"),
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BoardComment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @Column
    private Long authorId;              // 관리자 답변이면 관리자 ID, 익명이면 null

    @Column(nullable = false, length = 200)
    private String authorName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private boolean isAdminReply = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    @Column
    private Instant deletedAt;

    public static BoardComment createAdminReply(Board board, Long adminId, String adminName, String content) {
        BoardComment c = new BoardComment();
        c.board = board;
        c.authorId = adminId;
        c.authorName = adminName;
        c.content = content;
        c.isAdminReply = true;
        return c;
    }

    public void update(String content) { this.content = content; }
    public void softDelete() { this.deletedAt = Instant.now(); }
}
```

MVP에서 일반 사용자 댓글은 만들지 않음(공지·문의 양쪽 다). 답변(`isAdminReply=true`)만 등록 가능. `BoardConfig.allowComment`는 미래 확장용 플래그.

## 도메인 예외

```java
// BoardNotFoundException.java
public class BoardNotFoundException extends RuntimeException {
    public BoardNotFoundException(Long id) { super("Board not found: " + id); }
}

// BoardConfigNotFoundException.java
public class BoardConfigNotFoundException extends RuntimeException {
    public BoardConfigNotFoundException(String code) { super("BoardConfig not found: " + code); }
}

// GuestPasswordMismatchException.java
public class GuestPasswordMismatchException extends RuntimeException {
    public GuestPasswordMismatchException() { super("Guest password mismatch"); }
}

// BoardWriteForbiddenException.java
public class BoardWriteForbiddenException extends RuntimeException {
    public BoardWriteForbiddenException(String code) {
        super("Customer write not allowed for board: " + code);
    }
}
```

`common/exception/ErrorCode.java`에 코드 추가:
```java
BOARD_NOT_FOUND("BOARD_NOT_FOUND", "게시글을 찾을 수 없습니다."),
BOARD_CONFIG_NOT_FOUND("BOARD_CONFIG_NOT_FOUND", "게시판을 찾을 수 없습니다."),
GUEST_PASSWORD_MISMATCH("GUEST_PASSWORD_MISMATCH", "비밀번호가 일치하지 않습니다."),
BOARD_WRITE_FORBIDDEN("BOARD_WRITE_FORBIDDEN", "이 게시판은 작성이 제한됩니다."),
```

`common/exception/GlobalExceptionHandler.java`에 매핑 추가.

## Repository 인터페이스

### BoardConfigRepository

```java
package com.cj.restaurantbook.board.infrastructure;

import com.cj.restaurantbook.board.domain.BoardConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BoardConfigRepository extends JpaRepository<BoardConfig, Long> {
    Optional<BoardConfig> findByCode(String code);
    boolean existsByCode(String code);
    List<BoardConfig> findAllByIsActiveTrueOrderBySortOrderAsc();
    List<BoardConfig> findAllByOrderBySortOrderAsc();
}
```

### BoardRepository

```java
public interface BoardRepository extends JpaRepository<Board, Long> {

    @Query("""
        select b from Board b
        where b.boardConfig.code = :code
          and b.deletedAt is null
          and b.status = com.cj.restaurantbook.board.domain.BoardStatus.PUBLISHED
        order by b.isPinned desc, b.pinnedOrder asc nulls last, b.createdAt desc
        """)
    Page<Board> findPublicByCode(@Param("code") String code, Pageable pageable);

    @Query("""
        select b from Board b
        where b.boardConfig.code = :code
          and b.deletedAt is null
        order by b.isPinned desc, b.pinnedOrder asc nulls last, b.createdAt desc
        """)
    Page<Board> findAdminByCode(@Param("code") String code, Pageable pageable);

    Optional<Board> findByIdAndDeletedAtIsNull(Long id);

    @Query("""
        select count(b) from Board b
        where b.boardConfig.code = 'inquiry'
          and b.deletedAt is null
          and b.isAnswered = false
          and b.status = com.cj.restaurantbook.board.domain.BoardStatus.PUBLISHED
        """)
    long countUnansweredInquiries();
}
```

### BoardCommentRepository

```java
public interface BoardCommentRepository extends JpaRepository<BoardComment, Long> {
    List<BoardComment> findAllByBoardIdAndDeletedAtIsNullOrderByCreatedAtAsc(Long boardId);
    Optional<BoardComment> findByIdAndDeletedAtIsNull(Long id);
}
```

## 시더: BoardConfigSeeder

`config/BoardConfigSeeder.java` (`@Order(5)`로 NavigationMenuSeeder 다음):

```java
@Slf4j
@Component
@Order(5)
@RequiredArgsConstructor
public class BoardConfigSeeder implements ApplicationRunner {

    private final BoardConfigRepository repo;

    private record Def(String code, BoardKind kind, String displayName, String description,
                       boolean allowCustomerWrite, boolean allowComment, int sortOrder) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Def> defs = List.of(
            new Def("notice",  BoardKind.NOTICE,  "공지사항",    "매장 소식과 안내",          false, false, 0),
            new Def("inquiry", BoardKind.INQUIRY, "문의 게시판", "문의·요청을 남겨주세요",   true,  true,  1)
        );

        for (Def d : defs) {
            repo.findByCode(d.code()).ifPresentOrElse(
                existing -> existing.update(d.displayName(), d.description(),
                    d.allowCustomerWrite(), d.allowComment(), true, d.sortOrder()),
                () -> {
                    repo.save(BoardConfig.create(d.code(), d.kind(), d.displayName(),
                        d.description(), d.allowCustomerWrite(), d.allowComment(), d.sortOrder()));
                    log.info("Seeded BoardConfig: {}", d.code());
                }
            );
        }
    }
}
```

## DB 인덱스 정리

JPA가 자동 생성하는 것 외에 명시적으로 둘 인덱스:
- `boards(board_config_id, status, deleted_at)` — 게시판별 목록 조회 (가장 빈번)
- `boards(is_pinned, pinned_order)` — 핀 정렬
- `board_comments(board_id, deleted_at)` — 글별 댓글 조회

PostgreSQL `nulls last`는 ORDER BY 절에 명시 (위 JPQL 참고).

## 다음 문서

API 명세, Service, Controller, 권한 — [02-backend-api.md](./02-backend-api.md)
