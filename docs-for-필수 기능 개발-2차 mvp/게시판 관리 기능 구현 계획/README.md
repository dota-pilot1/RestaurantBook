# 게시판 관리 기능 구현 계획

작성일: 2026-05-08
참고 프로젝트: `/Users/terecal/beauty-book-hair` (BeautyBook 게시판 도메인)

## 문서

| 파일 | 내용 |
|------|------|
| [00-overview.md](./00-overview.md) | 전체 개요, 결정 요약, 아키텍처, 파일 변경 요약 |
| [01-backend-domain.md](./01-backend-domain.md) | `board` 도메인 — Board / BoardConfig / BoardComment 엔티티, 익명 작성 모델, JPA 매핑 |
| [02-backend-api.md](./02-backend-api.md) | REST API 명세, 비로그인 라우트, 익명 인증, WebSocket 토픽, 첨부 업로드(S3) |
| [03-frontend-customer.md](./03-frontend-customer.md) | 사용자 게시판 화면 + 헤더 중앙 "게시판" 드롭다운 메뉴 |
| [04-frontend-admin-config.md](./04-frontend-admin-config.md) | 관리자 — `BoardConfig` CRUD (게시판 자체를 추가/삭제/정책 변경) |
| [05-frontend-admin-posts.md](./05-frontend-admin-posts.md) | 관리자 — 게시글/답변 관리, 핀, 미답변 알림 |
| [06-step-by-step.md](./06-step-by-step.md) | 단계별 작업 순서 + 검증 체크리스트 |

## 핵심 결정 요약

- **게시판 종류 2종 + 확장 가능**: 공지사항(`NOTICE`) + 문의 게시판(`INQUIRY`). `BoardConfig`로 분리하여 관리자가 추후 게시판을 더 추가할 수 있는 구조 유지 (BeautyBook 패턴 동일).
- **익명 작성 (RestaurantBook 신규 정책)**: 문의 게시판은 비로그인/테이블 익명 고객도 작성 가능. 이름·연락처·게스트 비밀번호(4자리)로 본인 글 수정/삭제 인증. 공지는 관리자 전용 작성.
- **헤더 중앙 메뉴**: NavigationMenu에 루트 항목 `BOARDS`(드롭다운 부모)와 자식 `BOARD_NOTICE`, `BOARD_INQUIRY` 추가. 누구나 보임(`requiredRole=null`). 사용자측 일반 드롭다운 컴포넌트(`UserNavDropdown`) 신규 작성 — 관리자용 `AdminMegaMenu`와 분리.
- **관리자 메뉴**: `restaurant-admin-menu` 스킬을 사용하여 `ADMIN_BOARDS`(게시글 관리), `ADMIN_BOARD_CONFIGS`(게시판 설정 관리) 두 항목을 운영 관리 산하에 추가.
- **첨부파일**: 공통 `UploadService`(S3 presign URL) 신설. 게시판 도메인 외에도 매장 소개 이미지 등에서 재사용 가능하게.
- **WebSocket**: 새 문의 도착 시 관리자에게 알림 — 토픽 `boards:operations` 신설, 이벤트 `INQUIRY_CREATED`. 사용자측은 푸시 없음(MVP 단계).
- **삭제 정책**: soft delete (`deletedAt`) — BeautyBook 동일.
- **DB 스키마**: JPA auto-ddl(`update`) 사용. 마이그레이션 파일 불필요. 엔티티만 정의하면 부팅 시 자동 생성.

## 사용자 흐름 요약

```
일반 고객(테이블 익명)         서버                 관리자(웹)
    │                          │                       │
    │ GET /boards/notice       │                       │
    ├─────────────────────────▶│  공지 목록 조회         │
    │                          │                       │
    │ GET /boards/inquiry      │                       │
    │ POST /boards/inquiry     │                       │
    │  (이름, 연락처, 비번,     │                       │
    │   tableId optional)      │                       │
    ├─────────────────────────▶│ 익명 게시글 생성        │
    │                          ├──────────────────────▶│ WS: INQUIRY_CREATED
    │                          │                       │ "미답변 +1"
    │                          │                       │
    │                          │ POST .../comments     │
    │                          │◀──────────────────────┤ (관리자 답변)
    │                          │                       │
    │ GET /boards/inquiry/{id} │                       │
    ├─────────────────────────▶│ 본인 글 + 답변 조회     │
    │                          │                       │
    │ DELETE /boards/inquiry/  │                       │
    │ {id} + guestPassword     │                       │
    ├─────────────────────────▶│ 비번 매칭 → soft delete│
```

## 아키텍처 한 컷

```
┌────────────────────────────────────────────────────────────┐
│ 프론트엔드                                                  │
│                                                            │
│  Header.tsx                                                │
│   ├── DASHBOARD                                            │
│   ├── BOARDS (UserNavDropdown 신규)                        │
│   │    ├── /boards/notice                                  │
│   │    └── /boards/inquiry                                 │
│   └── ADMIN (AdminMegaMenu)                                │
│        └── 운영 관리                                       │
│             ├── ... 기존                                   │
│             ├── /admin/boards         (게시글 관리)        │
│             └── /admin/board-configs  (게시판 설정)        │
└────────────────────────────────────────────────────────────┘
                              │ HTTP (axios)
                              ▼
┌────────────────────────────────────────────────────────────┐
│ 백엔드 (Spring Boot DDD)                                    │
│                                                            │
│  board/                                                    │
│   ├── domain/                                              │
│   │    ├── Board                  (게시글)                 │
│   │    ├── BoardConfig            (게시판 종류)            │
│   │    ├── BoardComment           (댓글/답변)              │
│   │    ├── BoardKind enum         {NOTICE,INQUIRY,...}     │
│   │    └── BoardStatus enum       {PUBLISHED,HIDDEN,...}   │
│   ├── application/                                         │
│   │    ├── BoardService                                    │
│   │    └── BoardConfigService                              │
│   ├── infrastructure/                                      │
│   │    ├── BoardRepository                                 │
│   │    └── ...                                             │
│   └── presentation/                                        │
│        ├── PublicBoardController  (/api/boards/**)         │
│        ├── AdminBoardController   (/api/admin/boards/**)   │
│        └── dto/                                            │
│                                                            │
│  common/upload/                                            │
│   └── UploadService               (S3 presign 공통)        │
│                                                            │
│  config/                                                   │
│   ├── BoardConfigSeeder           (NOTICE, INQUIRY 시드)   │
│   ├── NavigationMenuSeeder        (BOARDS 메뉴 추가)       │
│   ├── PermissionCategorySeeder    (BOARD 카테고리)         │
│   ├── PermissionSeeder            (BOARD_VIEW/EDIT/DELETE) │
│   └── SecurityConfig              (공개 라우트 화이트리스트)│
└────────────────────────────────────────────────────────────┘
                              │ JPA (auto-ddl=update)
                              ▼
            ┌─────────────────────────────────────┐
            │ PostgreSQL                          │
            │  - boards                           │
            │  - board_configs                    │
            │  - board_comments                   │
            └─────────────────────────────────────┘
```

## 구현 순서 (한 줄 요약)

1. 백엔드 도메인 → 2. 백엔드 API + 시더 + 보안 → 3. 사용자 화면(공지/문의) + 헤더 메뉴 → 4. 관리자 게시글 관리 → 5. 관리자 게시판 설정 관리 → 6. WebSocket 알림 → 7. 검증

자세한 단계는 [06-step-by-step.md](./06-step-by-step.md) 참고.
