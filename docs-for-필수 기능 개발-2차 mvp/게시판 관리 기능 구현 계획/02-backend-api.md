# 02-backend-api

REST API 명세, Service, Controller, WebSocket, 보안, 첨부 업로드 공통.

## API 한눈에 보기

| 그룹 | 메서드 | URI | 인증 | 설명 |
|---|---|---|---|---|
| 공개 | GET | `/api/boards/configs` | 없음 | 활성 게시판 목록 |
| 공개 | GET | `/api/boards/{code}?page=&size=` | 없음 | 게시글 목록 (PUBLISHED만) |
| 공개 | GET | `/api/boards/{code}/{id}` | 없음 | 상세 (viewCount +1) |
| 공개 | GET | `/api/boards/{code}/{id}/comments` | 없음 | 댓글/답변 목록 |
| 고객 | POST | `/api/customer/boards/{code}` | 없음 | 새 글 (allowCustomerWrite=true 필요) |
| 고객 | POST | `/api/customer/boards/{code}/{id}/verify` | 없음 | 비번 확인 (수정 진입) |
| 고객 | PATCH | `/api/customer/boards/{code}/{id}` | 없음 | 본인 글 수정 (비번 또는 authorId 매칭) |
| 고객 | DELETE | `/api/customer/boards/{code}/{id}` | 없음 | 본인 글 삭제 (동일) |
| 관리자 | GET | `/api/admin/board-configs` | ADMIN | 모든 게시판 (비활성 포함) |
| 관리자 | POST | `/api/admin/board-configs` | ADMIN | 새 게시판 |
| 관리자 | PATCH | `/api/admin/board-configs/{code}` | ADMIN | 정책 변경 |
| 관리자 | DELETE | `/api/admin/board-configs/{code}` | ADMIN | 비활성 (soft) |
| 관리자 | GET | `/api/admin/boards/{code}?page=` | ADMIN | 게시글 목록 (모든 status) |
| 관리자 | GET | `/api/admin/boards/inquiries/unanswered/count` | ADMIN | 미답변 카운트 |
| 관리자 | POST | `/api/admin/boards/{code}` | ADMIN | 새 글 |
| 관리자 | PATCH | `/api/admin/boards/{code}/{id}` | ADMIN | 수정 |
| 관리자 | DELETE | `/api/admin/boards/{code}/{id}` | ADMIN | 삭제 (soft) |
| 관리자 | POST | `/api/admin/boards/{code}/{id}/pin` | ADMIN | 핀 고정 |
| 관리자 | DELETE | `/api/admin/boards/{code}/{id}/pin` | ADMIN | 핀 해제 |
| 관리자 | POST | `/api/admin/boards/{code}/{id}/comments` | ADMIN | 답변 등록 |
| 관리자 | PATCH | `/api/admin/comments/{id}` | ADMIN | 답변 수정 |
| 관리자 | DELETE | `/api/admin/comments/{id}` | ADMIN | 답변 삭제 |
| 공통 | POST | `/api/upload/presign` | 인증 | S3 업로드 presigned URL |

## DTO

### Request

```java
// CreateBoardRequest (관리자)
public record CreateBoardRequest(
    @NotBlank @Size(max = 500) String title,
    @NotBlank String content
) {}

// CreateGuestBoardRequest (익명 문의)
public record CreateGuestBoardRequest(
    @NotBlank @Size(max = 500) String title,
    @NotBlank String content,
    @NotBlank @Size(max = 200) String authorName,
    @NotBlank @Size(max = 100) String authorContact,
    @NotBlank @Size(min = 4, max = 8) String guestPassword,
    Long tableId
) {}

// UpdateGuestBoardRequest
public record UpdateGuestBoardRequest(
    @NotBlank @Size(max = 500) String title,
    @NotBlank String content,
    @NotBlank String guestPassword
) {}

// VerifyGuestPasswordRequest
public record VerifyGuestPasswordRequest(@NotBlank String guestPassword) {}

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
    Instant createdAt, boolean isGuest
) {}

public record BoardDetailResponse(
    Long id, String boardCode, String title, String content,
    String authorName, boolean isGuest, boolean canEdit,  // canEdit은 클라이언트가 verify 후 true 받음
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
    private final PasswordEncoder passwordEncoder;
    private final AppWebSocketHandler ws;

    // ─── 조회 ───

    public Page<Board> listPublic(String code, Pageable p)  { return boardRepo.findPublicByCode(code, p); }
    public Page<Board> listAdmin(String code, Pageable p)   { return boardRepo.findAdminByCode(code, p); }

    @Transactional
    public Board getAndIncrementView(Long id) {
        Board b = boardRepo.findByIdAndDeletedAtIsNull(id).orElseThrow(() -> new BoardNotFoundException(id));
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
    public Board createByGuest(String code, CreateGuestBoardRequest req) {
        BoardConfig cfg = configRepo.findByCode(code).orElseThrow(() -> new BoardConfigNotFoundException(code));
        if (!cfg.isAllowCustomerWrite()) throw new BoardWriteForbiddenException(code);
        Board b = boardRepo.save(Board.createByGuest(
            cfg, req.title(), req.content(), req.authorName(), req.authorContact(),
            passwordEncoder.encode(req.guestPassword()), req.tableId()
        ));
        if (cfg.getKind() == BoardKind.INQUIRY) {
            ws.broadcastInquiryCreated(Map.of("boardId", b.getId(), "code", code, "title", b.getTitle()));
        }
        return b;
    }

    // ─── 수정/삭제 ───

    @Transactional
    public void updateByGuest(Long id, UpdateGuestBoardRequest req) {
        Board b = boardRepo.findByIdAndDeletedAtIsNull(id).orElseThrow(() -> new BoardNotFoundException(id));
        verifyGuestPassword(b, req.guestPassword());
        b.update(req.title(), req.content());
    }

    @Transactional
    public void deleteByGuest(Long id, String guestPassword) {
        Board b = boardRepo.findByIdAndDeletedAtIsNull(id).orElseThrow(() -> new BoardNotFoundException(id));
        verifyGuestPassword(b, guestPassword);
        b.softDelete();
    }

    public void verifyGuestPassword(Board b, String rawPassword) {
        if (!b.isGuestPost() || b.getGuestPasswordHash() == null) {
            throw new GuestPasswordMismatchException();
        }
        if (!passwordEncoder.matches(rawPassword, b.getGuestPasswordHash())) {
            throw new GuestPasswordMismatchException();
        }
    }

    @Transactional
    public void updateByAdmin(Long id, CreateBoardRequest req) {
        getForAdmin(id).update(req.title(), req.content());
    }

    @Transactional
    public void deleteByAdmin(Long id) {
        Board b = getForAdmin(id);
        b.softDelete();
        // 답변 카운트 캐시 즉시 갱신
        if (b.getBoardConfig().getKind() == BoardKind.INQUIRY && !b.isAnswered()) {
            ws.broadcastInquiryAnswered(Map.of("boardId", id));
        }
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
            ws.broadcastInquiryAnswered(Map.of("boardId", boardId));
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
            ws.broadcastInquiryCreated(Map.of("boardId", b.getId(), "code", b.getBoardConfig().getCode()));
        }
    }
}
```

## Controller 4종

### PublicBoardController

```java
@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class PublicBoardController {

    private final BoardConfigService configService;
    private final BoardService boardService;

    @GetMapping("/configs")
    public List<BoardConfigResponse> listConfigs() {
        return configService.findAllActive().stream().map(BoardConfigResponse::from).toList();
    }

    @GetMapping("/{code}")
    public Page<BoardSummaryResponse> list(@PathVariable String code,
                                           @PageableDefault(size = 20) Pageable pageable) {
        return boardService.listPublic(code, pageable).map(BoardSummaryResponse::from);
    }

    @GetMapping("/{code}/{id}")
    public BoardDetailResponse detail(@PathVariable String code, @PathVariable Long id) {
        return BoardDetailResponse.from(boardService.getAndIncrementView(id), false);
    }

    @GetMapping("/{code}/{id}/comments")
    public List<CommentResponse> comments(@PathVariable Long id) {
        return boardService.listComments(id).stream().map(CommentResponse::from).toList();
    }
}
```

### CustomerBoardController (익명 작성/수정)

```java
@RestController
@RequestMapping("/api/customer/boards")
@RequiredArgsConstructor
public class CustomerBoardController {

    private final BoardService boardService;

    @PostMapping("/{code}")
    public ResponseEntity<BoardDetailResponse> create(@PathVariable String code,
                                                      @Valid @RequestBody CreateGuestBoardRequest req) {
        Board b = boardService.createByGuest(code, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(BoardDetailResponse.from(b, true));
    }

    @PostMapping("/{code}/{id}/verify")
    public ResponseEntity<Void> verify(@PathVariable Long id,
                                       @Valid @RequestBody VerifyGuestPasswordRequest req) {
        Board b = boardService.getForAdmin(id);  // status 체크 없이 모든 글
        boardService.verifyGuestPassword(b, req.guestPassword());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{code}/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id,
                                       @Valid @RequestBody UpdateGuestBoardRequest req) {
        boardService.updateByGuest(id, req);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{code}/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @RequestParam String guestPassword) {
        boardService.deleteByGuest(id, guestPassword);
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

    @GetMapping("/inquiries/unanswered/count")
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
.requestMatchers(HttpMethod.GET,    "/api/boards/**").permitAll()
.requestMatchers(HttpMethod.POST,   "/api/customer/boards/**").permitAll()
.requestMatchers(HttpMethod.PATCH,  "/api/customer/boards/**").permitAll()
.requestMatchers(HttpMethod.DELETE, "/api/customer/boards/**").permitAll()
```

`/api/admin/**` 는 기존에 ADMIN 가드가 있으므로 그대로.

## WebSocket 토픽 추가

`websocket/AppWebSocketHandler.java` 수정:

```java
private static final String TOPIC_BOARDS = "boards:operations";

public void broadcastInquiryCreated(Object payload) {
    broadcast(TOPIC_BOARDS, new WsMessage("INQUIRY_CREATED", payload));
}

public void broadcastInquiryAnswered(Object payload) {
    broadcast(TOPIC_BOARDS, new WsMessage("INQUIRY_ANSWERED", payload));
}
```

`AppWebSocketTopicResolver`(있다면)에서 ROLE_ADMIN만 `boards:operations` 구독 가능하도록 추가.

## 첨부 업로드 공통 (S3 presign)

게시판에서 직접 사용 안 하지만, 향후 확장과 다른 도메인(매장 소개 이미지 등)에서 재사용을 위해 이번에 같이 구축.

### `common/upload/UploadService.java`

```java
@Service
@RequiredArgsConstructor
public class UploadService {

    private final S3Presigner presigner;

    @Value("${aws.s3.bucket}") private String bucket;
    @Value("${aws.s3.prefix:restaurant-book}") private String prefix;
    @Value("${app.upload.presign-expires-seconds:300}") private long expires;

    public PresignResponse presign(PresignRequest req) {
        String safeName = sanitize(req.filename());
        String key = "%s/%s/%s-%s".formatted(prefix, req.folder(), UUID.randomUUID(), safeName);
        PutObjectRequest put = PutObjectRequest.builder()
            .bucket(bucket).key(key).contentType(req.contentType()).build();
        PresignedPutObjectRequest signed = presigner.presignPutObject(b -> b
            .signatureDuration(Duration.ofSeconds(expires)).putObjectRequest(put));
        return new PresignResponse(signed.url().toString(), key, expires);
    }

    private String sanitize(String name) {
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
```

### `common/upload/UploadController.java`

```java
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private final UploadService uploadService;

    @PostMapping("/presign")
    public PresignResponse presign(@Valid @RequestBody PresignRequest req) {
        return uploadService.presign(req);
    }
}
```

### `config/S3Config.java`

```java
@Configuration
public class S3Config {

    @Bean
    public S3Presigner s3Presigner(
        @Value("${aws.s3.access-key}") String accessKey,
        @Value("${aws.s3.secret-key}") String secretKey,
        @Value("${aws.s3.region}") String region
    ) {
        return S3Presigner.builder()
            .region(Region.of(region))
            .credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKey, secretKey)))
            .build();
    }
}
```

### `build.gradle` 의존성 추가 (이미 있는지 확인 후)

```groovy
implementation platform('software.amazon.awssdk:bom:2.25.0')
implementation 'software.amazon.awssdk:s3'
```

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

@ExceptionHandler(GuestPasswordMismatchException.class)
public ResponseEntity<ErrorResponse> handle(GuestPasswordMismatchException e) { return error(ErrorCode.GUEST_PASSWORD_MISMATCH, 403); }

@ExceptionHandler(BoardWriteForbiddenException.class)
public ResponseEntity<ErrorResponse> handle(BoardWriteForbiddenException e) { return error(ErrorCode.BOARD_WRITE_FORBIDDEN, 403); }
```

## 다음 문서

사용자 게시판 화면 + 헤더 메뉴 — [03-frontend-customer.md](./03-frontend-customer.md)
