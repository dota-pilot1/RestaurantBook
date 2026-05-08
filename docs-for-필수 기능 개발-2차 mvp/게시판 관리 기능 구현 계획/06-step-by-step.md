# 06-step-by-step

게시판 관리 기능을 작은 PR 단위로 나눠 진행하는 순서. 각 단계 끝에 검증 체크리스트를 둠.

전체 흐름:
```
A. 백엔드 도메인 + 시드 + 보안   (PR #1, ~1.5일)
B. 백엔드 API + WebSocket        (PR #2, ~1.5일)
C. 공통 업로드 (S3 presign)      (PR #3, ~0.5일, 선택적 분리)
D. 사용자 측 화면 + 헤더 메뉴    (PR #4, ~2일)
E. 관리자 게시판 설정 CRUD       (PR #5, ~1일)
F. 관리자 게시글 관리 + WS 알림  (PR #6, ~2일)
G. 마무리 검증 / 회고            (반나절)
```

A → B는 직렬, C는 B와 병렬 가능, D~F는 백엔드 안정화 후 병렬 가능.

## A. 백엔드 도메인 + 시드 + 보안

### 작업

1. `board/` 패키지 생성. 4계층(`domain/application/infrastructure/presentation`) 디렉토리
2. enum `BoardKind`, `BoardStatus` 작성
3. 엔티티 `BoardConfig`, `Board`, `BoardComment` 작성 (인덱스 포함)
4. 도메인 예외 4개 + `ErrorCode` 추가 + `GlobalExceptionHandler` 매핑
5. Repository 3개 작성 (커스텀 쿼리 포함)
6. `BoardConfigSeeder` (`@Order(5)`) 작성 — `notice`, `inquiry` 시드
7. `PermissionCategorySeeder` 수정 — `BOARD` 카테고리
8. `PermissionSeeder` 수정 — `BOARD_VIEW/EDIT/DELETE`
9. `SecurityConfig` 수정 — `/api/boards/**`, `/api/customer/boards/**` 화이트리스트
10. `application.yaml` — 필요 설정 점검 (이미 BCrypt 인코더 빈은 있음)

### 검증 체크리스트

- [ ] 백엔드 부팅 성공, 로그에 `Seeded BoardConfig: notice`, `Seeded BoardConfig: inquiry`
- [ ] DB에 `boards`, `board_configs`, `board_comments` 테이블 생성됨 (JPA auto-ddl)
- [ ] DB에 BOARD 권한 카테고리 + 3개 권한 행 생성
- [ ] 두 번째 부팅 시 동일 코드로 idempotent 동작 (중복 생성 안 됨)
- [ ] `psql`에서 `\d boards` 실행 시 인덱스 2개 존재
- [ ] `application.yaml`에 ddl-auto가 `update`인 환경에서만 작업 (production은 `validate` 또는 `none` 권장 — 운영 반영 전 점검)

### 회귀 테스트

기존 도메인(주문, 메뉴, 사용자) 테이블·시드가 변경 없이 부팅되는지 확인.

## B. 백엔드 API + WebSocket

### 작업

1. DTO 12개 작성 (`presentation/dto/`)
2. `BoardConfigService`, `BoardService` 작성
3. Controller 4개 작성: `PublicBoardController`, `CustomerBoardController`, `AdminBoardController`, `AdminBoardConfigController`
4. (별도 컨트롤러로 둘지 합칠지 — 답변 수정/삭제만 따로 `AdminCommentController`로 빼는 것 권장)
5. `AppWebSocketHandler` 수정 — `TOPIC_BOARDS` + 두 메서드 추가
6. (있다면) `AppWebSocketTopicResolver` — 관리자만 `boards:operations` 구독 가능

### 검증 체크리스트 (Postman/curl)

- [ ] `GET /api/boards/configs` → 200, `[notice, inquiry]` 두 개
- [ ] `POST /api/customer/boards/inquiry` (익명, 유효 body) → 201
- [ ] `POST /api/customer/boards/notice` (익명) → 403 (allowCustomerWrite=false)
- [ ] `GET /api/boards/inquiry` → 방금 만든 글 보임
- [ ] `GET /api/boards/inquiry/{id}` 두 번 호출 → viewCount 2 확인
- [ ] `POST /api/customer/boards/inquiry/{id}/verify` 정확한 비번 → 204, 틀린 비번 → 403
- [ ] `PATCH /api/customer/boards/inquiry/{id}` 비번 포함 → 204, 본문 변경됨
- [ ] `DELETE /api/customer/boards/inquiry/{id}?guestPassword=xxxx` → 204, 목록에서 사라짐
- [ ] 관리자 토큰 없이 `/api/admin/boards/inquiry` → 401/403
- [ ] 관리자 토큰으로 `POST /api/admin/boards/inquiry/{id}/comments` → 200, `isAdminReply=true` 댓글 생성, Board.isAnswered=true
- [ ] WS 클라이언트(예: wscat) → `subscribe boards:operations` → 새 익명 문의 작성 시 `INQUIRY_CREATED` 수신
- [ ] 답변 등록 시 `INQUIRY_ANSWERED` 수신
- [ ] `GET /api/admin/boards/inquiries/unanswered/count` → 정확한 숫자
- [ ] `BoardConfig` PATCH로 `allowCustomerWrite=false`로 변경 후 익명 작성 시도 → 403

### 보안 점검

- [ ] 익명 라우트가 정말 비인증으로 통과하는지 (JWT 없이 요청)
- [ ] `/api/admin/**` 가 ADMIN 외 롤로는 막히는지 (ROLE_CUSTOMER 토큰 시도)
- [ ] CORS — 기존 정책 그대로 적용되는지 (게시판 라우트도 통과)

## C. 공통 업로드 (S3 presign)

### 작업

1. `build.gradle`에 AWS SDK v2 의존성 추가 (있는지 확인)
2. `config/S3Config.java` — `S3Presigner` 빈
3. `common/upload/UploadService.java`, `UploadController.java`, DTO 2개
4. `application.yaml` — `aws.s3.*` (이미 있음) + `app.upload.presign-expires-seconds: 300`
5. `SecurityConfig` — `/api/upload/**` `.authenticated()` (관리자에 한정해도 OK)

### 검증 체크리스트

- [ ] `POST /api/upload/presign` (인증 토큰) → 200, presigned URL + key 반환
- [ ] 발급된 URL로 PUT (Content-Type 일치) → S3에 파일 업로드 성공
- [ ] 만료 시간 초과 후 PUT → 403/SignatureExpired
- [ ] 비인증 요청 → 401
- [ ] dev 환경에서 AWS 자격증명 미설정 시 어떻게 동작하는지 확인 (UploadService Bean 생성 실패하지 않게 — `aws.s3.access-key`가 빈 문자열이어도 빈 자체는 생성되도록)

게시판에서 즉시 사용하지 않으므로 PR을 분리해도 된다. 단, 이번 게시판 PR 이전에 머지되면 첨부 기능을 1주 안에 추가할 수 있는 길을 열어둠.

## D. 사용자 측 화면 + 헤더 메뉴

### 작업

1. **헤더 메뉴 추가** — `restaurant-admin-menu` 스킬을 게시판용이 아닌 **루트 메뉴 추가**용으로 약간 변형하거나 그냥 수동:
   - `NavigationMenuSeeder`에 `BOARDS` (parent=null), `BOARD_NOTICE`, `BOARD_INQUIRY` 추가
   - `ADMIN`의 displayOrder 1→2
   - i18n nav.ts 4개 언어에 `boards`, `boardNotice`, `boardInquiry` 키 추가
   - Header.tsx의 lucide import에 `Megaphone`, `MessageSquare` 추가
2. `UserNavDropdown` 컴포넌트 신규 작성 (`widgets/header/ui/`)
3. Header.tsx 분기 수정 — 자식 있는 루트 중 ADMIN 외에는 UserNavDropdown
4. (없으면) `resolveLucideIcon` 헬퍼 작성
5. entities/board — `model/types.ts`, `api/boardApi.ts`, `lib/guestPassword.ts`
6. features/board-customer — `BoardListView`, `BoardDetailView`, `InquiryWriteForm`, `GuestPasswordDialog`
7. 페이지: `/boards/page.tsx`(카드 그리드), `/boards/[code]/page.tsx`, `/boards/[code]/[id]/page.tsx`, `/boards/[code]/new/page.tsx`

### 검증 체크리스트 (브라우저)

- [ ] 비로그인 상태에서 `/`(홈) 진입 시 헤더 중앙에 "대시보드 / 게시판 / 관리(=관리자만)" 순서
- [ ] "게시판" 클릭 → 드롭다운 열림, "공지사항", "문의 게시판" 두 항목
- [ ] 공지사항 클릭 → `/boards/notice` 진입, 빈 목록 + "관리자만 작성 가능" 안내
- [ ] 문의 게시판 클릭 → `/boards/inquiry`, [+ 새 글] 버튼 보임
- [ ] [+ 새 글] → 폼 작성 → 제출 → 상세 페이지로 이동, 본인 글 수정 가능 상태
- [ ] 새 탭 열어서 같은 글 진입 → "본인 글 수정/삭제" 버튼 → 비번 다이얼로그
- [ ] 비번 정답 → 수정 폼, 비번 오답 → 토스트
- [ ] 익명 작성자 마스킹 노출 (목록·상세 모두)
- [ ] 페이지네이션 동작
- [ ] 모바일 폭에서 헤더 드롭다운 동작 (햄버거 메뉴와의 정합성)

### i18n 검증

- [ ] 언어 전환(LanguageSelect) 시 게시판 메뉴 이름이 4개 언어 모두 정상 표시
- [ ] 누락된 키 없음 (콘솔에 `i18next::translator: missingKey` 경고 없음)

## E. 관리자 게시판 설정 CRUD

### 작업

1. `restaurant-admin-menu` 스킬로 `ADMIN_BOARD_CONFIGS` 메뉴 추가 (운영 관리 산하)
2. entities/board — `api/boardConfigApi.ts`
3. features/board-config-admin — `BoardConfigManager`, `BoardConfigDialog`
4. 페이지 `/admin/board-configs/page.tsx`

### 검증 체크리스트

- [ ] 메뉴 드롭다운 [관리 > 운영 관리 > 게시판 설정] 진입
- [ ] 시드 게시판 2개 표시
- [ ] [+ 새 게시판] → code=`event`, kind=`EVENT`, allowCustomerWrite=true → 생성
- [ ] 사용자 측 `/boards/event` 직접 진입 가능 (헤더 드롭다운에는 안 잡힘 — 옵션 A)
- [ ] `/boards`(카드 그리드) 페이지에 새 게시판 카드 추가됨
- [ ] [수정] → allowCustomerWrite를 false로 변경 → 사용자 작성 시도 → 403
- [ ] [비활성] → 사용자 측 `/boards/event` 404, 관리자 측에는 회색으로 보임
- [ ] code 중복 입력 시 즉시 에러 표시
- [ ] 시드 코드(`notice`, `inquiry`)는 code/kind 수정 불가 (input disabled)

## F. 관리자 게시글 관리 + WS 알림

### 작업

1. `restaurant-admin-menu` 스킬로 `ADMIN_BOARDS` 메뉴 추가 (운영 관리 산하)
2. entities/board — `api/adminBoardApi.ts`
3. features/board-admin — `AdminBoardWorkspace`, `BoardSidebar`, `AdminBoardTable`, `BoardDetailPane`, `BoardCommentForm`, `AdminBoardEditor`, `PinToggleButton`
4. 페이지 `/admin/boards/page.tsx`
5. 미답변 카운트 hook + 사이드바 배지
6. WS 구독 hook (`boards:operations`) → 카운트/목록 invalidate

### 검증 체크리스트

- [ ] 메뉴 드롭다운 [관리 > 운영 관리 > 게시글 관리] 진입
- [ ] 좌측 사이드바 게시판 두 개 + 미답변 카운트
- [ ] 공지사항 선택 → [+ 새 글] → 작성 → 사용자 측 `/boards/notice`에서 보임
- [ ] 핀 고정 → 목록 상단 고정 + 사용자 측에서도 상단 표시
- [ ] 문의 게시판에서 미답변 글 클릭 → [답변 등록] → 즉시 `isAnswered=true` 반영, 사이드바 배지 -1
- [ ] 다른 브라우저 탭에서 익명 문의 작성 → 관리자 탭의 사이드바 배지 +1 (WS)
- [ ] 답변 삭제 → `isAnswered=false`로 복귀, 배지 +1
- [ ] [숨김] → 사용자 측에서 안 보임, 관리자 측에는 회색
- [ ] [삭제] → 양쪽 모두에서 사라짐, DB에는 deletedAt 채워짐
- [ ] 익명 작성자 정보(이름·연락처·tableId) 마스킹 없이 노출

## G. 마무리 검증 / 회고

### 종합 시나리오 테스트

1. 매장 운영자가 새 공지 작성 → 키오스크/홀에서 보임
2. 손님이 테이블에서 문의 작성 → 관리자에게 실시간 알림
3. 관리자가 답변 → 손님이 `/boards/inquiry/{id}`에서 답변 확인
4. 손님이 자기 글 수정 → 비번 검증 후 수정 성공
5. 손님이 자기 글 삭제 → 사용자/관리자 모두에서 사라짐
6. 관리자가 새 게시판(`event`) 추가 → 사용자 측 `/boards`에 노출
7. 비활성 처리 → 사용자 측 사라짐

### 모바일 / 반응형

- iPhone SE 크기에서 모든 화면 정상
- 키오스크(태블릿) 가로 모드에서 레이아웃 안 깨짐
- 헤더 햄버거 메뉴에 게시판 항목 노출

### 성능 / 부하

- 게시글 100개 작성 후 목록 페이지네이션 응답 속도 (P95 < 500ms 기준)
- DB 인덱스 사용 확인 (`EXPLAIN ANALYZE` 로 idx_boards_config_status 사용 여부)

### 회고 기록

- 잘 된 것
- 어려웠던 것
- 다음 PR로 미룬 것 (대댓글, 검색, 첨부파일, 푸시 알림, 휴지통)
- BeautyBook과 비교한 차이점 정리 (익명 작성, 마스킹 정책, MVP 범위)

## 작업 추정 (총 ~1.5주)

| 단계 | 사람 | 기간 |
|---|---|---|
| A. 백엔드 도메인 | 1 | 1.5일 |
| B. 백엔드 API + WS | 1 | 1.5일 |
| C. 업로드 공통 (선택) | 1 | 0.5일 |
| D. 사용자 화면 + 헤더 | 1 | 2일 |
| E. 관리자 게시판 설정 | 1 | 1일 |
| F. 관리자 게시글 관리 | 1 | 2일 |
| G. 마무리 검증 | 1 | 0.5일 |
| **총** | | **~9일** |

병렬 가능한 곳: D ↔ E ↔ F (백엔드 B 안정화 후). 1명 단독이면 직렬 그대로.

## 위험 및 완화

| 위험 | 영향 | 완화 |
|---|---|---|
| JPA auto-ddl=update가 production에 적용되어 데이터 손실 | 高 | production은 `validate` 또는 `none`. dev/staging만 update | 
| 익명 비밀번호 4자리 → 무차별 추측 | 中 | 클라이언트에서 3회 실패 시 60초 잠금. 서버는 rate-limit 필터 추가 검토 |
| 익명 라우트 악용 (스팸 작성) | 中 | IP 기반 rate-limit 미들웨어. 짧은 시간 내 동일 IP 다수 작성 차단 |
| 5번째 루트 메뉴 추가로 헤더 레이아웃 깨짐 | 低 | 현재 루트는 DASHBOARD/BOARDS/ADMIN 3개라 여유 있음. 모바일에서만 햄버거 |
| WS 구독 권한 누락 | 中 | 토픽 리졸버에서 ROLE_ADMIN 검증 + 통합 테스트 |
| 본문 XSS | 高 | textarea만 받고 표시 시 escape (Next.js 기본). 마크다운/리치 에디터 도입 시 sanitize 라이브러리 |

## 마지막 점검 후 머지

모든 PR 머지 직전 한 번 더:
- `restaurant-admin-menu` 스킬로 추가된 메뉴들이 `NavigationMenuSeeder.java` 라인 정렬 안 깨졌는지 diff 확인
- `Header.tsx`의 `adminMenuMeta`에 `ADMIN_BOARDS`, `ADMIN_BOARD_CONFIGS` 둘 다 등록되었는지 (스킬 자동 처리)
- i18n 4개 언어 파일에 `boards`, `boardNotice`, `boardInquiry` 키 모두 있는지
- `restaurant-admin-menu` 스킬 자체에 BOARDS(루트 레벨, 사용자측)을 추가한 사례를 README에 한 줄 추가하면 향후 비슷한 작업에 도움
