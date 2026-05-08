# 00-overview

## 사용자 결정 (Q&A)

### Q1. 게시판 종류 범위
**A: 공지 + 문의 2종 (실용 최소).**
단, BoardConfig 구조로 관리자가 추후에 FAQ·이벤트·매장후기 등을 추가할 수 있게 확장 가능하게 둠.

### Q2. 작성 권한
**A: 공지 = 관리자만 / 문의 = 로그인 사용자만 작성.**
- 공지: `allowCustomerWrite=false`, 관리자만 게시·핀·삭제.
- 문의: `allowCustomerWrite=true`. 로그인 사용자만 작성 가능. 비로그인/테이블 익명 고객은 게시판 자체를 보지 않아도 되는 정책으로 확정.

### Q3. 노출 위치
**A: 헤더 네비 중간(=상단 헤더 가운데 영역) "게시판" 드롭다운.**
로그인 사용자에게만 보임. 자식으로 공지/문의 두 항목.

### Q4. BeautyBook 코드 재활용
**A: 참고는 하되 그대로 베끼지 않음.** RestaurantBook DDD 컨벤션과 로그인 사용자 작성 정책에 맞게 적응. 엔티티 분리 패턴(Board/BoardConfig/BoardComment)과 API URL 컨벤션은 동일하게 차용.

## BeautyBook 참고 후 RestaurantBook 적용 차이

BeautyBook의 게시판 구현은 `Board / BoardConfig / BoardComment` 구조, `BoardConfigSeeder`, 공개 목록/상세 API, 관리자 게시글 API를 참고한다. 다만 RestaurantBook에는 다음 차이가 있어 그대로 이식하지 않는다.

- BeautyBook은 로그인 사용자 중심 댓글/게시글 모델이고, RestaurantBook도 MVP에서는 같은 방향으로 간다. 비로그인/테이블 익명 고객은 게시판 자체를 보지 않아도 되므로 `authorContact`, `guestPasswordHash`, `tableId`, 비밀번호 검증 API는 만들지 않는다.
- BeautyBook은 게시판 생성 시 메뉴를 자동 동기화하지만, RestaurantBook은 이미 `NavigationMenuSeeder`와 관리자 메뉴 구조가 있으므로 MVP에서는 `notice`, `inquiry`만 헤더에 고정하고 신규 게시판은 `/boards` 카드 목록에서 노출한다.
- BeautyBook의 첨부/S3 구조는 참고만 한다. RestaurantBook에는 이미 `common/upload`가 있으므로 신규 생성하지 않는다.
- BeautyBook API는 상세/수정 시 `id` 중심이다. RestaurantBook은 URL에 `{code}`가 포함되므로 `id`가 해당 `BoardConfig.code`에 속하는지 항상 검증한다.

## 아키텍처 결정

### 도메인 분리
1. **`Board`** (게시글) — title, content, authorId(nullable), authorName, status, isPinned, viewCount, deletedAt
2. **`BoardConfig`** (게시판 설정) — code, kind, displayName, allowCustomerWrite, allowComment, isActive, sortOrder
3. **`BoardComment`** (댓글/답변) — boardId FK, authorId(nullable), authorName, content, isAdminReply, deletedAt

세 엔티티로 분리한 이유:
- BoardConfig 분리 → 관리자가 게시판 자체를 추가/삭제/정책 변경 가능 (예: "이벤트" 게시판 신설, "FAQ" 잠금)
- BoardComment 분리 → 1:N으로 단순. 답변(관리자 댓글)과 일반 댓글을 `isAdminReply` 플래그로 구분
- Attachment 별도 엔티티 안 만듦 → MVP에서는 게시판 첨부 자체를 비목표로 둔다. 관리자 이미지 첨부가 필요해지면 기존 `common/upload` presign API를 재사용하고, 본격 갤러리/대용량 첨부 시 별도 엔티티로 분리한다.

### 로그인 작성 모델

비로그인/테이블 익명 고객은 게시판 범위에서 제외한다. 문의 게시판 작성자는 로그인 사용자이며, 본인 글 수정/삭제는 `authorId` 매칭 또는 관리자 권한으로 판단한다.

**필드** (Board 엔티티):
- `authorId` Long nullable — 관리자/로그인 사용자 작성 시 PK. 시스템 시드 글이면 null 가능
- `authorName` String 200 — 작성자 표시명
- `status`, `isPinned`, `isAnswered`, `viewCount`, `deletedAt`

**인증 흐름:**
- 조회: 로그인 사용자만 가능. 비로그인 요청은 401.
- 작성: 로그인 사용자만 가능. POST `/api/boards/{code}`. 공지(`allowCustomerWrite=false`) 게시판은 일반 사용자 403, 관리자만 작성 가능.
- 수정/삭제(작성자): PATCH/DELETE `/api/boards/{code}/{id}`. `authorId` 매칭 필요. `id`가 `{code}` 게시판에 속하는지도 반드시 검증.
- 수정/삭제(관리자): PATCH/DELETE `/api/admin/boards/{code}/{id}`. 패스워드 무시, 관리자 토큰만으로 가능. 이 경우도 `code-id` 불일치면 404.

### URL 컨벤션

```
사용자 (로그인 필요)
  GET  /api/boards/configs                   게시판 목록 (활성)
  GET  /api/boards/{code}                    게시글 목록
  GET  /api/boards/{code}/{id}               상세 + viewCount 증가
  GET  /api/boards/{code}/{id}/comments      댓글 목록
  POST   /api/boards/{code}                    새 글 (allowCustomerWrite=true 만)
  PATCH  /api/boards/{code}/{id}               본인 글 수정
  DELETE /api/boards/{code}/{id}               본인 글 삭제

관리자
  GET    /api/admin/board-configs                 모든 BoardConfig
  POST   /api/admin/board-configs                 새 게시판
  PATCH  /api/admin/board-configs/{code}          정책 변경
  DELETE /api/admin/board-configs/{code}          게시판 비활성(soft)

  GET    /api/admin/boards/{code}                 게시글 목록 (모든 status)
  POST   /api/admin/boards/{code}                 새 글 (관리자 작성)
  PATCH  /api/admin/boards/{code}/{id}            수정
  PATCH  /api/admin/boards/{code}/{id}/visibility 게시/숨김 전환
  DELETE /api/admin/boards/{code}/{id}            삭제
  POST   /api/admin/boards/{code}/{id}/pin        핀 고정
  DELETE /api/admin/boards/{code}/{id}/pin        핀 해제
  POST   /api/admin/boards/{code}/{id}/comments   답변 등록 (isAdminReply=true)

업로드 공통 (기존 구현 재사용)
  POST   /api/upload/presign                      ADMIN 전용 이미지 presigned URL
```

### 미답변 갱신

MVP에서는 게시판 WebSocket 토픽을 만들지 않는다. 관리자 화면 진입, 새로고침, 답변/삭제 mutation 성공 후 REST API를 다시 조회해서 미답변 수와 목록을 갱신한다.

### 보안 설정

`SecurityConfig.java`에 추가:
```java
.requestMatchers("/api/boards/**").authenticated()
.requestMatchers("/api/admin/boards/**", "/api/admin/board-configs/**").hasRole("ADMIN")
```

RestaurantBook의 기존 `/api/upload/presign`은 ADMIN 전용 이미지 업로드로 유지한다. 게시판 첨부는 MVP 범위 밖이다.

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
- `presentation/BoardController.java`, `AdminBoardController.java`, `AdminBoardConfigController.java`
- `presentation/dto/` (10여 개)

**기존 공통 업로드 재사용** (`src/main/java/com/cj/restaurantbook/common/upload/`):
- `UploadService.java`, `UploadController.java`, `S3Config.java`, `S3Properties.java`가 이미 존재
- 이번 게시판 MVP에서는 새 파일을 만들지 않고, 관리자 이미지 첨부가 필요할 때 기존 `/api/upload/presign`만 재사용

**시더/보안/메뉴**:
- `config/BoardConfigSeeder.java` 신규
- `config/PermissionCategorySeeder.java` 수정 — `BOARD` 카테고리
- `config/PermissionSeeder.java` 수정 — `BOARD_VIEW`/`BOARD_EDIT`/`BOARD_DELETE`
- `config/NavigationMenuSeeder.java` 수정 — `BOARDS`, `BOARD_NOTICE`, `BOARD_INQUIRY`, `ADMIN_BOARDS`, `ADMIN_BOARD_CONFIGS` 추가
- `config/SecurityConfig.java` 수정 — `/api/boards/**` 인증 필요, `/api/admin/boards/**`, `/api/admin/board-configs/**` ADMIN 필요

### 프론트엔드 (`restaurant-book-front`)

**신규 entities** (`src/entities/board/`):
- `api/boardApi.ts`, `boardConfigApi.ts`, `commentApi.ts`
- `model/types.ts` — `Board`, `BoardConfig`, `BoardComment`, `BoardKind`, `BoardStatus`
- `lib/` — 날짜 포맷/작성자 표시 등 필요한 순수 유틸만 추가. 게스트 비밀번호 저장소는 만들지 않음

**신규 features**:
- `src/features/board-customer/` — `BoardListView`, `BoardDetailView`, `InquiryWriteForm`
- `src/features/board-admin/` — `AdminBoardTable`, `AdminBoardEditor`, `BoardCommentForm`, `PinToggleButton`
- `src/features/board-config-admin/` — `BoardConfigTable`, `BoardConfigDialog`

**신규 widgets**:
- `Header.tsx`의 기존 일반 `DropdownMenu` 재사용 또는 `src/widgets/header/ui/UserNavDropdown.tsx`로 분리 — 관리자 메가메뉴와 별개

**신규 페이지**:
- `src/app/boards/[code]/page.tsx` — 사용자 게시판
- `src/app/boards/[code]/[id]/page.tsx` — 사용자 상세
- `src/app/admin/boards/page.tsx` — 관리자 게시글 관리
- `src/app/admin/board-configs/page.tsx` — 관리자 게시판 설정

**Header.tsx 수정**:
- `adminMenuMeta`에 `ADMIN_BOARDS`, `ADMIN_BOARD_CONFIGS` 추가
- 루트 레벨 NavigationMenu 중 자식이 있고 ADMIN이 아닌 경우 일반 드롭다운 렌더링. 현재 `Header.tsx`는 이미 `DropdownMenu`를 갖고 있으므로 신규 컴포넌트보다 기존 분기 재사용이 우선. 헤더 navTree는 기존 정책대로 로그인 사용자에게만 렌더링한다.
- lucide import: `MessageSquare`, `Megaphone`, `Newspaper` 추가

## 비-목표 (이번 PR에서 안 함)

- 게시판 첨부파일 (이미지/PDF) — 기존 `UploadService`는 있으나 게시판 연결은 안 함. 다음 단계.
- 댓글의 댓글 (대댓글) — 1뎁스만.
- 좋아요/조회수 정렬 — `viewCount` 컬럼만 있고 정렬은 최신순 + 핀 우선 고정.
- 비로그인/익명 문의 작성 — MVP 제외. 필요해지면 별도 PR에서 연락처/비밀번호/rate-limit 정책과 함께 설계.
- 검색 — 목록 페이지에 검색창 없음. 페이지네이션만.
- 푸시 알림(고객 → 답변 도착) — pull 방식만. 추후 LINE/Kakao 연동 등 검토.

## 백엔드 라이브러리 의존성

대부분 기존 의존성으로 해결:
- `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security` (이미 있음)
- `spring-boot-starter-security` — 로그인 사용자/관리자 권한 검증에 사용

추가 검토:
- AWS SDK v2와 `common/upload`는 RestaurantBook에 이미 있으므로 중복 추가하지 않는다.
