# 02-backend-api

REST API 명세, Service, Controller, 보안, 기존 업로드 API 재사용 기준.

## API 한눈에 보기

| 그룹 | 메서드 | URI | 인증 | 설명 |
|---|---|---|---|---|
| 사용자 | GET | `/api/boards/configs` | 로그인 | 활성 게시판 목록 |
| 사용자 | GET | `/api/boards/{code}?page=&size=` | 로그인 | 게시글 목록 (PUBLISHED만) |
| 사용자 | GET | `/api/boards/{code}/{id}` | 로그인 | 상세 (viewCount +1) |
| 사용자 | GET | `/api/boards/{code}/{id}/comments` | 로그인 | 댓글/답변 목록 |
| 사용자 | POST | `/api/boards/{code}` | 로그인 | 새 글 (allowCustomerWrite=true 필요) |
| 사용자 | PATCH | `/api/boards/{code}/{id}` | 작성자/ADMIN | 본인 글 수정 |
| 사용자 | DELETE | `/api/boards/{code}/{id}` | 작성자/ADMIN | 본인 글 삭제 |
| 관리자 | GET | `/api/admin/board-configs` | ADMIN | 모든 게시판 (비활성 포함) |
| 관리자 | POST | `/api/admin/board-configs` | ADMIN | 새 게시판 |
| 관리자 | PATCH | `/api/admin/board-configs/{code}` | ADMIN | 정책 변경 |
| 관리자 | DELETE | `/api/admin/board-configs/{code}` | ADMIN | 비활성 (soft) |
| 관리자 | GET | `/api/admin/boards/{code}?page=` | ADMIN | 게시글 목록 (모든 status) |
| 관리자 | GET | `/api/admin/boards/inquiries/unanswered-count` | ADMIN | 미답변 카운트 |
| 관리자 | POST | `/api/admin/boards/{code}` | ADMIN | 새 글 |
| 관리자 | PATCH | `/api/admin/boards/{code}/{id}` | ADMIN | 수정 |
| 관리자 | DELETE | `/api/admin/boards/{code}/{id}` | ADMIN | 삭제 (soft) |
| 관리자 | PATCH | `/api/admin/boards/{code}/{id}/pin` | ADMIN | 핀 고정 |
| 관리자 | PATCH | `/api/admin/boards/{code}/{id}/unpin` | ADMIN | 핀 해제 |
| 관리자 | POST | `/api/admin/boards/{code}/{id}/comments` | ADMIN | 답변 등록 |
| 관리자 | PATCH | `/api/admin/boards/comments/{id}` | ADMIN | 답변 수정 |
| 관리자 | DELETE | `/api/admin/boards/comments/{id}` | ADMIN | 답변 삭제 |
| 공통 | POST | `/api/upload/presign` | ADMIN | 기존 S3 이미지 업로드 presigned URL |

## DTO

### Request

```java
// CreateBoardRequest (사용자/관리자)
public record CreateBoardRequest(
    @NotBlank @Size(max = 500) String title,
    @NotBlank String content
) {}

// CreateBoardConfigRequest
public record CreateBoardConfigRequest(
    @NotBlank @Pattern(regexp = "^[a-z0-9_-]+$") @Size(max = 100) String code,
    @NotNull BoardKind kind,
    @NotBlank @Size(max = 200) String displayName,
    @Size(max = 500) String description,
    boolean allowCustomerWrite,
    boolean allowComment,
    int sortOrder
) {}

// UpdateBoardConfigRequest — kind, code 제외 (불변)
public record UpdateBoardConfigRequest(
    @NotBlank @Size(max = 200) String displayName,
    @Size(max = 500) String description,
    boolean allowCustomerWrite,
    boolean allowComment,
    boolean isActive,
    int sortOrder
) {}

// CreateAdminCommentRequest
public record CreateAdminCommentRequest(@NotBlank String content) {}
```

### Response

```java
public record BoardConfigResponse(
    Long id, String code, BoardKind kind, String displayName, String description,
    boolean allowCustomerWrite, boolean allowComment, boolean isActive, int sortOrder
) { /* fromEntity static factory */ }

public record BoardSummaryResponse(
    Long id, String boardCode, String title, String authorName,
    boolean isPinned, boolean isAnswered, int viewCount,
    Instant createdAt
) {}

public record BoardDetailResponse(
    Long id, String boardCode, String title, String content,
    String authorName, boolean canEdit,
    boolean isPinned, boolean isAnswered, int viewCount,
    Instant createdAt, Instant updatedAt
) {}

public record CommentResponse(
    Long id, Long boardId, String authorName, String content,
    boolean isAdminReply, Instant createdAt
) {}

public record InquiryUnansweredCountResponse(long count) {}
```

## Service 계층

### BoardConfigService

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardConfigService {

    private final BoardConfigRepository repo;

    public List<BoardConfig> findAllActive() {
        return repo.findAllByIsActiveTrueOrderBySortOrderAsc();
    }

    public List<BoardConfig> findAll() {
        return repo.findAllByOrderBySortOrderAsc();
    }

    public BoardConfig findByCode(String code) {
        return repo.findByCode(code).orElseThrow(() -> new BoardConfigNotFoundException(code));
    }

    @Transactional
    public BoardConfig create(CreateBoardConfigRequest req) {
        if (repo.existsByCode(req.code())) {
            throw new IllegalArgumentException("Code already exists: " + req.code());
        }
        return repo.save(BoardConfig.create(
            req.code(), req.kind(), req.displayName(), req.description(),
            req.allowCustomerWrite(), req.allowComment(), req.sortOrder()
        ));
    }

    @Transactional
    public void update(String code, UpdateBoardConfigRequest req) {
        BoardConfig c = findByCode(code);
        c.update(req.displayName(), req.description(), req.allowCustomerWrite(),
            req.allowComment(), req.isActive(), req.sortOrder());
    }

    @Transactional
    public void deactivate(String code) {
        findByCode(code).deactivate();
    }
}
```

### BoardService

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardService {

    private final BoardRepository boardRepo;
    private final BoardCommentRepository commentRepo;
    private final BoardConfigRepository configRepo;

    // ─── 조회 ───

    public Page<Board> listVisible(String code, Pageable p) { return boardRepo.findVisibleByCode(code, p); }
    public Page<Board> listAdmin(String code, Pageable p)   { return boardRepo.findAdminByCode(code, p); }

    @Transactional
    public Board getAndIncrementView(String code, Long id) {
        Board b = getByCodeAndId(code, id);
        if (b.getStatus() != BoardStatus.PUBLISHED) throw new BoardNotFoundException(id);
        b.incrementViewCount();
        return b;
    }

    public Board getForAdmin(Long id) {
        return boardRepo.findByIdAndDeletedAtIsNull(id).orElseThrow(() -> new BoardNotFoundException(id));
    }

    public List<BoardComment> listComments(Long boardId) {
        return commentRepo.findAllByBoardIdAndDeletedAtIsNullOrderByCreatedAtAsc(boardId);
    }

    public long countUnansweredInquiries() { return boardRepo.countUnansweredInquiries(); }

    // ─── 작성 ───

    @Transactional
    public Board createByAdmin(String code, CreateBoardRequest req, Long adminId, String adminName) {
        BoardConfig cfg = configRepo.findByCode(code).orElseThrow(() -> new BoardConfigNotFoundException(code));
        return boardRepo.save(Board.createByMember(cfg, req.title(), req.content(), adminId, adminName));
    }

    @Transactional
    public Board createByMember(String code, CreateBoardRequest req, Long userId, String userName) {
        BoardConfig cfg = configRepo.findByCode(code).orElseThrow(() -> new BoardConfigNotFoundException(code));
        if (!cfg.isAllowCustomerWrite()) throw new BoardWriteForbiddenException(code);
        return boardRepo.save(Board.createByMember(cfg, req.title(), req.content(), userId, userName));
    }

    // ─── 수정/삭제 ───

    @Transactional
    public void updateByAuthor(String code, Long id, CreateBoardRequest req, Long userId) {
        Board b = getByCodeAndId(code, id);
        if (!b.isAuthor(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);
        b.update(req.title(), req.content());
    }

    @Transactional
    public void deleteByAuthor(String code, Long id, Long userId) {
        Board b = getByCodeAndId(code, id);
        if (!b.isAuthor(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);
        b.softDelete();
    }

    public Board getByCodeAndId(String code, Long id) {
        Board b = boardRepo.findByIdAndDeletedAtIsNull(id).orElseThrow(() -> new BoardNotFoundException(id));
        if (!b.getBoardConfig().getCode().equals(code)) throw new BoardNotFoundException(id);
        return b;
    }

    @Transactional
    public void updateByAdmin(Long id, CreateBoardRequest req) {
        getForAdmin(id).update(req.title(), req.content());
    }

    @Transactional
    public void deleteByAdmin(Long id) {
        Board b = getForAdmin(id);
        b.softDelete();
    }

    @Transactional
    public void pin(Long id) {
        Board b = getForAdmin(id);
        // 같은 게시판의 기존 핀 max+1
        int next = boardRepo.findAdminByCode(b.getBoardConfig().getCode(), Pageable.unpaged())
            .stream().filter(Board::isPinned).mapToInt(x -> x.getPinnedOrder() == null ? 0 : x.getPinnedOrder())
            .max().orElse(-1) + 1;
        b.pin(next);
    }

    @Transactional
    public void unpin(Long id) { getForAdmin(id).unpin(); }

    // ─── 답변(댓글) ───

    @Transactional
    public BoardComment createAdminReply(Long boardId, String content, Long adminId, String adminName) {
        Board b = getForAdmin(boardId);
        BoardComment c = commentRepo.save(BoardComment.createAdminReply(b, adminId, adminName, content));
        if (b.getBoardConfig().getKind() == BoardKind.INQUIRY && !b.isAnswered()) {
            b.markAnswered();
        }
        return c;
    }

    @Transactional
    public void updateComment(Long commentId, String content) {
        commentRepo.findByIdAndDeletedAtIsNull(commentId)
            .orElseThrow(() -> new IllegalArgumentException("Comment not found"))
            .update(content);
    }

    @Transactional
    public void deleteComment(Long commentId) {
        BoardComment c = commentRepo.findByIdAndDeletedAtIsNull(commentId)
            .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        Board b = c.getBoard();
        c.softDelete();
        // 답변이 모두 삭제되면 isAnswered 되돌림
        boolean anyReplyLeft = commentRepo.findAllByBoardIdAndDeletedAtIsNullOrderByCreatedAtAsc(b.getId())
            .stream().anyMatch(BoardComment::isAdminReply);
        if (!anyReplyLeft && b.isAnswered()) {
            b.markUnanswered();
        }
    }
}
```

## Controller 3종

### BoardController

```java
@RestController
@RequestMapping("/api/boards")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class BoardController {

    private final BoardConfigService configService;
    private final BoardService boardService;

    @GetMapping("/configs")
    public List<BoardConfigResponse> listConfigs() {
        return configService.findAllActive().stream().map(BoardConfigResponse::from).toList();
    }

    @GetMapping("/{code}")
    public Page<BoardSummaryResponse> list(@PathVariable String code,
                                           @PageableDefault(size = 20) Pageable pageable) {
        return boardService.listVisible(code, pageable).map(BoardSummaryResponse::from);
    }

    @GetMapping("/{code}/{id}")
    public BoardDetailResponse detail(@PathVariable String code,
                                      @PathVariable Long id,
                                      @AuthenticationPrincipal UserPrincipal user) {
        return BoardDetailResponse.from(
            boardService.getAndIncrementView(code, id),
            boardService.canEdit(code, id, user.getId()));
    }

    @GetMapping("/{code}/{id}/comments")
    public List<CommentResponse> comments(@PathVariable Long id) {
        return boardService.listComments(id).stream().map(CommentResponse::from).toList();
    }

    @PostMapping("/{code}")
    public ResponseEntity<BoardDetailResponse> create(@PathVariable String code,
                                                      @Valid @RequestBody CreateBoardRequest req,
                                                      @AuthenticationPrincipal UserPrincipal user) {
        Board b = boardService.createByMember(code, req, user.getId(), user.getDisplayName());
        return ResponseEntity.status(HttpStatus.CREATED).body(BoardDetailResponse.from(b, true));
    }

    @PatchMapping("/{code}/{id}")
    public ResponseEntity<Void> update(@PathVariable String code,
                                       @PathVariable Long id,
                                       @Valid @RequestBody CreateBoardRequest req,
                                       @AuthenticationPrincipal UserPrincipal user) {
        boardService.updateByAuthor(code, id, req, user.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{code}/{id}")
    public ResponseEntity<Void> delete(@PathVariable String code,
                                       @PathVariable Long id,
                                       @AuthenticationPrincipal UserPrincipal user) {
        boardService.deleteByAuthor(code, id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
```

### AdminBoardController

```java
@RestController
@RequestMapping("/api/admin/boards")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminBoardController {

    private final BoardService boardService;

    @GetMapping("/{code}")
    public Page<BoardSummaryResponse> listAdmin(@PathVariable String code,
                                                @PageableDefault(size = 20) Pageable pageable) {
        return boardService.listAdmin(code, pageable).map(BoardSummaryResponse::from);
    }

    @GetMapping("/inquiries/unanswered-count")
    public InquiryUnansweredCountResponse unansweredCount() {
        return new InquiryUnansweredCountResponse(boardService.countUnansweredInquiries());
    }

    @PostMapping("/{code}")
    public ResponseEntity<BoardDetailResponse> create(@PathVariable String code,
                                                      @Valid @RequestBody CreateBoardRequest req,
                                                      @AuthenticationPrincipal UserPrincipal user) {
        Board b = boardService.createByAdmin(code, req, user.getId(), user.getDisplayName());
        return ResponseEntity.status(HttpStatus.CREATED).body(BoardDetailResponse.from(b, true));
    }

    @PatchMapping("/{code}/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id, @Valid @RequestBody CreateBoardRequest req) {
        boardService.updateByAdmin(id, req);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{code}/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        boardService.deleteByAdmin(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{code}/{id}/pin")
    public ResponseEntity<Void> pin(@PathVariable Long id) {
        boardService.pin(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{code}/{id}/pin")
    public ResponseEntity<Void> unpin(@PathVariable Long id) {
        boardService.unpin(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{code}/{id}/comments")
    public CommentResponse reply(@PathVariable Long id,
                                 @Valid @RequestBody CreateAdminCommentRequest req,
                                 @AuthenticationPrincipal UserPrincipal user) {
        return CommentResponse.from(
            boardService.createAdminReply(id, req.content(), user.getId(), user.getDisplayName()));
    }
}
```

### AdminBoardConfigController, AdminCommentController

(동일 패턴 — 생략)

## SecurityConfig 추가

`config/SecurityConfig.java`의 authorizeHttpRequests 블록에 추가:

```java
.requestMatchers("/api/boards/**").authenticated()
.requestMatchers("/api/admin/boards/**", "/api/admin/board-configs/**").hasRole("ADMIN")
```

`/api/admin/**` 는 기존에 ADMIN 가드가 있으므로 그대로.

## 미답변 갱신

WebSocket은 MVP 범위에서 제외한다. 관리자 화면은 화면 진입/새로고침/답변 처리 후 `GET /api/admin/boards/inquiries/unanswered-count`를 재조회한다.

## 기존 업로드 API 재사용

RestaurantBook에는 이미 `common/upload` 구현이 있다.

- `common/upload/UploadService.java`
- `common/upload/UploadController.java`
- `common/upload/S3Config.java`
- `common/upload/S3Properties.java`
- `build.gradle`의 AWS SDK v2 의존성

이번 게시판 MVP에서는 게시판 첨부를 연결하지 않는다. 관리자 에디터에 이미지 첨부가 필요해지는 시점에 기존 ADMIN 전용 `POST /api/upload/presign`을 재사용한다.

## 권한 시드 추가

`PermissionCategorySeeder.java`:
```java
new CategoryDef("BOARD", "게시판", "게시판 및 게시글 관련 권한", 7),
```

`PermissionSeeder.java`:
```java
new PermDef("BOARD_VIEW",   "게시판 조회",   "게시판/게시글 목록·상세 페이지 접근",     "BOARD"),
new PermDef("BOARD_EDIT",   "게시판 수정",   "게시글 작성·수정·핀, 답변 등록",         "BOARD"),
new PermDef("BOARD_DELETE", "게시판 삭제",   "게시글·답변 삭제, 게시판 자체 비활성",    "BOARD"),
```

MVP는 RoleSeeder에서 ADMIN에 자동 부여. 매니저 등 다른 롤에 부분 권한 부여는 추후.

## ErrorCode/GlobalExceptionHandler 매핑

`common/exception/GlobalExceptionHandler.java`에 추가:
```java
@ExceptionHandler(BoardNotFoundException.class)
public ResponseEntity<ErrorResponse> handle(BoardNotFoundException e) { return error(ErrorCode.BOARD_NOT_FOUND, 404); }

@ExceptionHandler(BoardConfigNotFoundException.class)
public ResponseEntity<ErrorResponse> handle(BoardConfigNotFoundException e) { return error(ErrorCode.BOARD_CONFIG_NOT_FOUND, 404); }

@ExceptionHandler(BoardWriteForbiddenException.class)
public ResponseEntity<ErrorResponse> handle(BoardWriteForbiddenException e) { return error(ErrorCode.BOARD_WRITE_FORBIDDEN, 403); }
```

## 다음 문서

사용자 게시판 화면 + 헤더 메뉴 — [03-frontend-customer.md](./03-frontend-customer.md)
