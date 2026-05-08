# 00-overview

## 사용자 결정 (Q&A)

### Q1. 게시판 종류 범위
**A: 공지 + 문의 2종 (실용 최소).**
단, BoardConfig 구조로 관리자가 추후에 FAQ·이벤트·매장후기 등을 추가할 수 있게 확장 가능하게 둠.

### Q2. 작성 권한
**A: 공지 = 관리자만 / 문의 = 테이블 익명 고객도 작성.**
- 공지: `allowCustomerWrite=false`, 관리자만 게시·핀·삭제.
- 문의: `allowCustomerWrite=true`. 비로그인 익명 작성 허용. 이름·연락처·게스트 비밀번호(4자리 숫자) 입력. tableId가 있으면 자동 부착.

### Q3. 노출 위치
**A: 헤더 네비 중간(=상단 헤더 가운데 영역) "게시판" 드롭다운.**
누구에게나 보임. 자식으로 공지/문의 두 항목.

### Q4. BeautyBook 코드 재활용
**A: 참고는 하되 그대로 베끼지 않음.** RestaurantBook DDD 컨벤션과 익명 작성 정책에 맞게 적응. 엔티티 분리 패턴(Board/BoardConfig/BoardComment)과 API URL 컨벤션은 동일하게 차용.

## 아키텍처 결정

### 도메인 분리
1. **`Board`** (게시글) — title, content, authorId(nullable), authorName, status, isPinned, viewCount, deletedAt
2. **`BoardConfig`** (게시판 설정) — code, kind, displayName, allowCustomerWrite, allowComment, isActive, sortOrder
3. **`BoardComment`** (댓글/답변) — boardId FK, authorId(nullable), authorName, content, isAdminReply, deletedAt

세 엔티티로 분리한 이유:
- BoardConfig 분리 → 관리자가 게시판 자체를 추가/삭제/정책 변경 가능 (예: "이벤트" 게시판 신설, "FAQ" 잠금)
- BoardComment 분리 → 1:N으로 단순. 답변(관리자 댓글)과 일반 댓글을 `isAdminReply` 플래그로 구분
- Attachment 별도 엔티티 안 만듦 → S3 키 배열을 Board에 jsonb 컬럼으로 직접 저장(MVP). 본격 갤러리/대용량 첨부 시 분리 가능

### 익명 작성 모델 (RestaurantBook 신규)

BeautyBook에는 없던 정책. RestaurantBook은 테이블 기반 익명 고객이 메인 사용자라 필요.

**필드 추가** (Board 엔티티에):
- `authorId` Long nullable — 로그인 사용자 작성 시 PK
- `authorName` String 200 — 익명·로그인 모두 필수
- `authorContact` String 100 — 익명 작성 시 필수 (전화 또는 이메일)
- `guestPasswordHash` String 200 — 익명 작성 시 필수 (BCrypt). 본인 글 수정/삭제 인증용
- `tableId` Long nullable — 테이블에서 작성 시 자동 부착

**인증 흐름:**
- 작성: 비로그인 OK. POST `/api/customer/boards/{code}` (공개 라우트). 공지(`allowCustomerWrite=false`) 게시판은 403.
- 수정/삭제(익명): PATCH/DELETE `/api/customer/boards/{code}/{id}` + body에 `guestPassword`. 서버에서 hash 비교.
- 수정/삭제(관리자): PATCH/DELETE `/api/admin/boards/{code}/{id}`. 패스워드 무시, 관리자 토큰만으로 가능.

### URL 컨벤션

```
공개 (비로그인 OK)
  GET  /api/boards/configs                   게시판 목록 (활성)
  GET  /api/boards/{code}                    게시글 목록
  GET  /api/boards/{code}/{id}               상세 + viewCount 증가
  GET  /api/boards/{code}/{id}/comments      댓글 목록

고객 작성/수정 (비로그인 OK, 익명)
  POST   /api/customer/boards/{code}              새 글 (allowCustomerWrite=true 만)
  PATCH  /api/customer/boards/{code}/{id}         본인 글 수정 (guestPassword)
  DELETE /api/customer/boards/{code}/{id}         본인 글 삭제 (guestPassword)
  POST   /api/customer/boards/{code}/{id}/verify  비밀번호 검증(수정 모드 진입용)

관리자
  GET    /api/admin/board-configs                 모든 BoardConfig
  POST   /api/admin/board-configs                 새 게시판
  PATCH  /api/admin/board-configs/{code}          정책 변경
  DELETE /api/admin/board-configs/{code}          게시판 비활성(soft)

  GET    /api/admin/boards/{code}                 게시글 목록 (모든 status)
  POST   /api/admin/boards/{code}                 새 글 (관리자 작성)
  PATCH  /api/admin/boards/{code}/{id}            수정
  DELETE /api/admin/boards/{code}/{id}            삭제
  POST   /api/admin/boards/{code}/{id}/pin        핀 고정
  DELETE /api/admin/boards/{code}/{id}/pin        핀 해제
  POST   /api/admin/boards/{code}/{id}/comments   답변 등록 (isAdminReply=true)

업로드 공통
  POST   /api/upload/presign                      { filename, contentType, folder } → presigned URL
```

### WebSocket 토픽

기존 컨벤션(`{domain}:operations`, `customer:{thing}/{id}`)을 따름:
- `boards:operations` — 관리자 화면용. 이벤트:
  - `INQUIRY_CREATED` — 새 문의 글 생성 (관리자 미답변 카운트 +1)
  - `INQUIRY_ANSWERED` — 답변 등록 (-1)
- 사용자측 토픽은 MVP에서 없음. 답변 알림은 사용자가 다시 들어와서 확인하는 폴(pull) 방식.

### 보안 설정

`SecurityConfig.java`에 추가:
```java
.requestMatchers(HttpMethod.GET,    "/api/boards/**").permitAll()
.requestMatchers(HttpMethod.GET,    "/api/customer/boards/**").permitAll()
.requestMatchers(HttpMethod.POST,   "/api/customer/boards/**").permitAll()
.requestMatchers(HttpMethod.PATCH,  "/api/customer/boards/**").permitAll()
.requestMatchers(HttpMethod.DELETE, "/api/customer/boards/**").permitAll()
.requestMatchers("/api/admin/boards/**", "/api/admin/board-configs/**").hasRole("ADMIN")
.requestMatchers("/api/upload/**").authenticated()
```

업로드는 익명에게 열어주면 악용 위험 — MVP는 익명 첨부 비허용. 본문 텍스트만. 추후 정책 결정 시 image/* MIME만 허용 + size 제한 + rate-limit 추가 가능.

### 시드 데이터

`BoardConfigSeeder.java`(신규) — 부팅 시 idempotent upsert:
```java
new BoardConfigDef("notice",  BoardKind.NOTICE,  "공지사항",   "매장 소식과 안내",     false, false, 0),
new BoardConfigDef("inquiry", BoardKind.INQUIRY, "문의 게시판", "문의·요청을 남겨주세요", true,  true,  1),
```

## 변경/추가 파일 요약

### 백엔드 (`restaurant-book-server`)

**신규 도메인 패키지** (`src/main/java/com/cj/restaurantbook/board/`):
- `domain/Board.java`, `BoardConfig.java`, `BoardComment.java`, `BoardKind.java`, `BoardStatus.java`
- `application/BoardService.java`, `BoardConfigService.java`
- `infrastructure/BoardRepository.java`, `BoardConfigRepository.java`, `BoardCommentRepository.java`
- `presentation/PublicBoardController.java`, `CustomerBoardController.java`, `AdminBoardController.java`, `AdminBoardConfigController.java`
- `presentation/dto/` (10여 개)

**신규 공통** (`src/main/java/com/cj/restaurantbook/common/upload/`):
- `UploadService.java`, `UploadController.java`, `dto/PresignRequest.java`, `PresignResponse.java`
- `config/S3Config.java` (S3Presigner Bean)

**WebSocket**:
- `websocket/AppWebSocketHandler.java` 수정 — `TOPIC_BOARDS = "boards:operations"` 추가, `broadcastInquiryCreated()`, `broadcastInquiryAnswered()` 메서드

**시더/보안/메뉴**:
- `config/BoardConfigSeeder.java` 신규
- `config/PermissionCategorySeeder.java` 수정 — `BOARD` 카테고리
- `config/PermissionSeeder.java` 수정 — `BOARD_VIEW`/`BOARD_EDIT`/`BOARD_DELETE`
- `config/NavigationMenuSeeder.java` 수정 — `BOARDS`, `BOARD_NOTICE`, `BOARD_INQUIRY`, `ADMIN_BOARDS`, `ADMIN_BOARD_CONFIGS` 추가
- `config/SecurityConfig.java` 수정 — `/api/boards/**`, `/api/customer/boards/**` 화이트리스트

### 프론트엔드 (`restaurant-book-front`)

**신규 entities** (`src/entities/board/`):
- `api/boardApi.ts`, `boardConfigApi.ts`, `commentApi.ts`
- `model/types.ts` — `Board`, `BoardConfig`, `BoardComment`, `BoardKind`, `BoardStatus`
- `lib/guestPassword.ts` — sessionStorage 기반 익명 비번 관리

**신규 features**:
- `src/features/board-customer/` — `BoardListView`, `BoardDetailView`, `InquiryWriteForm`, `GuestPasswordDialog`
- `src/features/board-admin/` — `AdminBoardTable`, `AdminBoardEditor`, `BoardCommentForm`, `PinToggleButton`
- `src/features/board-config-admin/` — `BoardConfigTable`, `BoardConfigDialog`

**신규 widgets**:
- `src/widgets/header/ui/UserNavDropdown.tsx` — 사용자측 드롭다운 (관리자 메가메뉴와 별개)

**신규 페이지**:
- `src/app/boards/[code]/page.tsx` — 사용자 게시판
- `src/app/boards/[code]/[id]/page.tsx` — 사용자 상세
- `src/app/admin/boards/page.tsx` — 관리자 게시글 관리
- `src/app/admin/board-configs/page.tsx` — 관리자 게시판 설정

**Header.tsx 수정**:
- `adminMenuMeta`에 `ADMIN_BOARDS`, `ADMIN_BOARD_CONFIGS` 추가
- 루트 레벨 NavigationMenu 중 자식이 있고 ADMIN이 아닌 경우 `UserNavDropdown` 렌더링하도록 분기 추가
- lucide import: `MessageSquare`, `Megaphone`, `Newspaper` 추가

## 비-목표 (이번 PR에서 안 함)

- 첨부파일 (이미지/PDF) 업로드 — `UploadService`만 만들고 게시판에서는 사용 안 함. 다음 단계.
- 댓글의 댓글 (대댓글) — 1뎁스만.
- 좋아요/조회수 정렬 — `viewCount` 컬럼만 있고 정렬은 최신순 + 핀 우선 고정.
- 비밀번호 분실 복구 — MVP는 비번 잊으면 새로 작성. (전화번호 SMS 인증 등은 추후)
- 검색 — 목록 페이지에 검색창 없음. 페이지네이션만.
- 푸시 알림(고객 → 답변 도착) — pull 방식만. 추후 LINE/Kakao 연동 등 검토.

## 백엔드 라이브러리 의존성

대부분 기존 의존성으로 해결:
- `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security` (이미 있음)
- `org.springframework.security:spring-security-crypto` — BCrypt (Security 끼워서 이미 있음)

추가 검토:
- AWS SDK v2 `software.amazon.awssdk:s3`, `s3-presigner` — `build.gradle`에 없으면 추가 (이미 있는지 확인 필요)
