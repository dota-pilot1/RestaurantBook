# 게시판 관리 기능 구현 계획

작성일: 2026-05-08
참고 프로젝트: `/Users/terecal/beauty-book-hair` (BeautyBook 게시판 도메인)

## 문서

| 파일 | 내용 |
|------|------|
| [00-overview.md](./00-overview.md) | 전체 개요, 결정 요약, 아키텍처, 파일 변경 요약 |
| [01-backend-domain.md](./01-backend-domain.md) | `board` 도메인 — Board / BoardConfig / BoardComment 엔티티, 로그인 작성 모델, JPA 매핑 |
| [02-backend-api.md](./02-backend-api.md) | REST API 명세, 인증 라우트, 기존 업로드 API 재사용 기준 |
| [03-frontend-customer.md](./03-frontend-customer.md) | 사용자 게시판 화면 + 헤더 중앙 "게시판" 드롭다운 메뉴 |
| [04-frontend-admin-config.md](./04-frontend-admin-config.md) | 관리자 — `BoardConfig` CRUD (게시판 자체를 추가/삭제/정책 변경) |
| [05-frontend-admin-posts.md](./05-frontend-admin-posts.md) | 관리자 — 게시글/답변 관리, 핀, 미답변 알림 |
| [06-step-by-step.md](./06-step-by-step.md) | 단계별 작업 순서 + 검증 체크리스트 |

## 핵심 결정 요약

- **게시판 종류 2종 + 확장 가능**: 공지사항(`NOTICE`) + 문의 게시판(`INQUIRY`). `BoardConfig`로 분리하여 관리자가 추후 게시판을 더 추가할 수 있는 구조 유지 (BeautyBook 패턴 동일).
- **로그인 사용자 작성**: 문의 게시판은 로그인 사용자만 작성 가능. 비로그인/테이블 익명 고객은 게시판 자체를 보지 않아도 되는 정책으로 확정. 공지는 관리자 전용 작성.
- **헤더 중앙 메뉴**: NavigationMenu에 루트 항목 `BOARDS`(드롭다운 부모)와 자식 `BOARD_NOTICE`, `BOARD_INQUIRY` 추가. `requiredRole=null`이지만 현재 `Header.tsx` 정책대로 헤더 메뉴는 로그인 사용자에게만 노출. 기존 일반 드롭다운(`DropdownMenu`)을 우선 재사용하고, 필요할 때만 `UserNavDropdown`으로 분리.
- **관리자 메뉴**: `restaurant-admin-menu` 스킬을 사용하여 `ADMIN_BOARDS`(게시글 관리), `ADMIN_BOARD_CONFIGS`(게시판 설정 관리) 두 항목을 운영 관리 산하에 추가.
- **첨부파일**: RestaurantBook에는 이미 `common/upload` S3 presign 구현이 있음. 이번 게시판 MVP에서는 게시판 첨부를 연결하지 않고, 관리자 이미지 첨부가 필요할 때 기존 `/api/upload/presign`을 재사용.
- **실시간 알림**: MVP에서는 WebSocket을 만들지 않는다. 관리자 화면 진입/새로고침/답변 처리 후 REST 재조회로 미답변 수와 목록을 갱신한다.
- **삭제 정책**: soft delete (`deletedAt`) — BeautyBook 동일.
- **DB 스키마**: JPA auto-ddl(`update`) 사용. 마이그레이션 파일 불필요. 엔티티만 정의하면 부팅 시 자동 생성.

## 사용자 흐름 요약

```
로그인 사용자                 서버                 관리자(웹)
    │                          │                       │
    │ GET /boards/notice       │                       │
    ├─────────────────────────▶│ 공지 목록 조회          │
    │                          │                       │
    │ GET /boards/inquiry      │                       │
    │ POST /boards/inquiry     │                       │
    ├─────────────────────────▶│ 로그인 사용자 문의 생성  │
    │                          │                       │ 관리자 화면 REST 재조회
    │                          │                       │ "미답변 +1"
    │                          │                       │
    │                          │ POST .../comments     │
    │                          │◀──────────────────────┤ (관리자 답변)
    │                          │                       │
    │ GET /boards/inquiry/{id} │                       │
    ├─────────────────────────▶│ 본인 글 + 답변 조회     │
    │                          │                       │
    │ PATCH/DELETE             │                       │
    │ /boards/inquiry/{id}     │                       │
    ├─────────────────────────▶│ 작성자/관리자 확인      │
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
│        ├── BoardController        (/api/boards/**)         │
│        ├── AdminBoardController   (/api/admin/boards/**)   │
│        └── dto/                                            │
│                                                            │
│  common/upload/                                            │
│   └── UploadService               (기존 S3 presign 공통)   │
│                                                            │
│  config/                                                   │
│   ├── BoardConfigSeeder           (NOTICE, INQUIRY 시드)   │
│   ├── NavigationMenuSeeder        (BOARDS 메뉴 추가)       │
│   ├── PermissionCategorySeeder    (BOARD 카테고리)         │
│   ├── PermissionSeeder            (BOARD_VIEW/EDIT/DELETE) │
│   └── SecurityConfig              (게시판 인증 라우트 추가)│
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

1. 백엔드 도메인 → 2. 백엔드 API + 시더 + 보안 → 3. 사용자 화면(공지/문의) + 헤더 메뉴 → 4. 관리자 게시글 관리 → 5. 관리자 게시판 설정 관리 → 6. Lexical 에디터 연결 → 7. 기존 업로드 API 재사용 여부 확인 → 8. 검증

자세한 단계는 [06-step-by-step.md](./06-step-by-step.md) 참고.
