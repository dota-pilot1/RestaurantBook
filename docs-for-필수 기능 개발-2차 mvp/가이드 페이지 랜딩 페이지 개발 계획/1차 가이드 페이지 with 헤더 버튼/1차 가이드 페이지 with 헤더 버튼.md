# 1차: 사용 가이드 페이지 + 헤더 버튼

작성일: 2026-05-08

## 목적

로그인한 사용자에게 "이 시스템에서 내 역할이 뭘 할 수 있는지"를 1분 안에 보여주는 가이드 페이지를 만든다.
관리자/매니저/직원/주방/고객 5개 역할 중, **현장에서 일하는 직원·주방·고객 3개를 핵심**으로 다룬다.
관리자 화면은 별도 매뉴얼 없이 짧은 링크 리스트로만 노출한다.

## 범위 (이번 1차에 하는 것)

- 라우트 추가: `/guide` (메인), `/guide/staff`, `/guide/kitchen`, `/guide/customer`
- 헤더에 "사용 가이드" 메뉴 1개 추가 — **로그인된 모든 사용자에게 노출**
- 메인 페이지 구성:
  - 상단 hero — 주문 1건이 가게에서 흐르는 길 (고객 → 주방 → 직원) 가로 플로우
  - 본문 — 역할 카드 3개 (직원·주방·고객) + 각 카드는 핵심 3~5단계 요약
  - 하단 — 관리자 메뉴 링크 모음 (접힘 상태)
- 역할별 상세 페이지 3장 — 스크린샷 1~2장 + 단계 설명
- i18n: 한/영/일/중 (4개 언어) 키 등록 (한국어/영어 카피 필수, 일/중은 한국어 폴백 허용)
- 비로그인 시 진입 차단 또는 `/login`으로 리다이렉트

## 범위 밖 (이번엔 안 함)

- 마케팅용 랜딩 페이지 (잠재 고객 대상) — **2차 문서**에서 다룸
- FAQ, 검색창, 영상 임베드, 챗봇
- 관리자 14개 화면 1:1 매뉴얼화
- 가이드 콘텐츠를 DB에서 관리(CMS화)

## 단계별 문서

| 순서 | 문서 | 목적 |
| --- | --- | --- |
| 1 | [01-라우팅과 헤더 메뉴 추가.md](./01-라우팅과%20헤더%20메뉴%20추가.md) | `/guide` 라우트 셸과 헤더 진입 동선 |
| 2 | [02-가이드 메인 페이지 (플로우 + 카드).md](./02-가이드%20메인%20페이지%20(플로우%20%2B%20카드).md) | hero 플로우, 역할 카드 3개, 관리자 링크 |
| 3 | [03-역할별 상세 페이지 (직원·주방·고객).md](./03-역할별%20상세%20페이지%20(직원·주방·고객).md) | 3개 상세 페이지의 콘텐츠와 컴포넌트 |
| 4 | [04-i18n 콘텐츠 카피.md](./04-i18n%20콘텐츠%20카피.md) | ko/en/ja/zh 가이드 네임스페이스 추가 |
| 5 | [05-검증 체크리스트.md](./05-검증%20체크리스트.md) | 동선·권한·다국어·반응형 검증 |

## 참고 문서 (기준 사실)

| 문서 | 활용 포인트 |
| --- | --- |
| `docs-for-프로젝트 관리/구현 현황/1차 mvp 구현 현황.md` | 가이드에서 설명할 핵심 흐름 (키오스크 주문 → 주방 보드 → 직원 결제 → 매출). 주문 상태 전이 `RECEIVED → ACCEPTED → COOKING → READY → COMPLETED` |
| `docs-for-프로젝트 관리/구현 현황/2차 mvp 구현 현황.md` | 2차에서 추가된 직원 호출, 환불, 조리 불필요 자동 READY, 메뉴 체크 배지 — 가이드에 반영 |
| `docs-for-필수 기능 개발-2차 mvp/결제 취소 및 환불 도메인 개발/` | 직원 가이드의 "환불" 단계 근거 |
| `docs-for-필수 기능 개발-2차 mvp/고객의 직원 호출 기능 구현/` | 고객 가이드 "직원 호출" + 직원 가이드 "호출 처리" 근거 |

## 현재 코드 기준 사실

- 프론트 경로는 `restaurant-book-front` (Next.js App Router).
- 헤더 컴포넌트는 [src/widgets/header/ui/Header.tsx](../../../../restaurant-book-front/src/widgets/header/ui/Header.tsx).
- 헤더는 두 갈래로 메뉴를 만든다:
  - 서버에서 받은 `navigationMenuApi.list()` 결과를 트리로 변환
  - 실패/빈 응답이면 `fallbackNavigationMenus` 상수 사용
- i18n은 [src/shared/i18n/index.ts](../../../../restaurant-book-front/src/shared/i18n/index.ts)에서 초기화. 네임스페이스: `common`, `nav`, `auth`, `form`. 가이드는 새 네임스페이스 `guide`를 추가한다.
- 4개 언어: ko / en / ja / zh.
- 역할 코드: `ROLE_ADMIN`, `ROLE_MANAGER`, `ROLE_KITCHEN`, `ROLE_STAFF`, `ROLE_CUSTOMER`.
- 비로그인 라우팅은 [src/app/page.tsx](../../../../restaurant-book-front/src/app/page.tsx)에서 `/login`으로 리다이렉트.
- 실제 구현된 핵심 화면:
  - 고객 키오스크: [src/features/kiosk/KioskHome.tsx](../../../../restaurant-book-front/src/features/kiosk/KioskHome.tsx)
  - 직원 보드: [src/features/staff-ready-orders/StaffReadyOrders.tsx](../../../../restaurant-book-front/src/features/staff-ready-orders/StaffReadyOrders.tsx)
  - 매니저 대시보드: [src/app/manager/dashboard/page.tsx](../../../../restaurant-book-front/src/app/manager/dashboard/page.tsx)
  - 주방: [src/app/kitchen/page.tsx](../../../../restaurant-book-front/src/app/kitchen/page.tsx)

## 권장 작업 순서

1. **라우트 셸 + 헤더 버튼** — 빈 페이지여도 `/guide`가 헤더에서 클릭 가능해야 다음 작업이 빨라진다.
2. **메인 페이지의 역할 카드 3개** — 카드 데이터 모델을 먼저 잡으면 상세 페이지가 그대로 따라온다.
3. **상세 페이지 3개** — 스크린샷은 placeholder로 시작해도 된다.
4. **i18n** — 한국어 먼저 굳힌 뒤 영어를 채운다 (ja/zh는 키만 등록하고 ko 폴백 허용).
5. **검증** — 권한별 노출, 직링크, 모바일 레이아웃.

## UI/UX 원칙 (이 프로젝트에 한정)

- **분량 상한**: 메인 페이지 스크롤 3회 이내, 상세 페이지 스크롤 5회 이내.
- **카드 텍스트**: 한 단계 = 한 줄 (10자 내외 동사구).
- **스크린샷**: 실제 화면 캡처 사용. UI 라벨이 바뀌면 캡처도 함께 갱신한다는 규칙을 [05-검증 체크리스트.md](./05-검증%20체크리스트.md)에 둔다.
- **톤**: 기존 [AuthLayout](../../../../restaurant-book-front/src/shared/ui/AuthLayout.tsx)·로그인 hero와 같은 결.
- **다크/라이트**: 둘 다 지원. 기존 [ThemeSwitcher](../../../../restaurant-book-front/src/widgets/header/ui/Header.tsx) 동작에 맞춘다.
