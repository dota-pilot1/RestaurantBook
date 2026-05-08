# 02. 랜딩 페이지 hero & 섹션 구성

## 목표

비로그인 방문자가 5~7섹션을 스크롤하며 "이 시스템 도입할까?"를 판단할 수 있게 한다.
콘텐츠는 1차/2차 MVP에서 **이미 구현된 기능**에만 의존한다 — 없는 기능 약속 금지.

## 페이지 골격

```
┌─────────────────────────────────────────────────────────┐
│ Top Bar (간소화 헤더): 로고 / 언어선택 / 로그인 / 회원가입 │
├─────────────────────────────────────────────────────────┤
│ 1. Hero                                                  │
│    제목 / 부제 / [회원가입 시작하기] [데모 화면 보기]      │
│    → 우측 또는 하단에 핵심 화면 캡처 1장                   │
├─────────────────────────────────────────────────────────┤
│ 2. 핵심 가치 3개 카드                                       │
│    실시간 운영 / 직원 호출 / 매출 자동 집계                  │
├─────────────────────────────────────────────────────────┤
│ 3. 주요 화면 미리보기 (3-up)                               │
│    [고객 키오스크] [주방 보드] [직원 결제]                  │
├─────────────────────────────────────────────────────────┤
│ 4. 기능 목록 (간단)                                        │
│    체크리스트 형태, 12개 내외                                │
├─────────────────────────────────────────────────────────┤
│ 5. 도입 흐름 (3 step)                                       │
│    가입 → 메뉴 등록 → 운영 시작                              │
├─────────────────────────────────────────────────────────┤
│ 6. CTA 반복 + Footer                                        │
│    [회원가입] [로그인]  /  연락처 · 약관 · 개인정보처리방침   │
└─────────────────────────────────────────────────────────┘
```

## 1. 컴포넌트 배치

```
src/features/landing/
├── ui/
│   ├── LandingPage.tsx        # 컴포지션 루트
│   ├── LandingTopBar.tsx      # 간소화 헤더
│   ├── HeroSection.tsx
│   ├── ValueCards.tsx
│   ├── ScreensPreview.tsx
│   ├── FeatureList.tsx
│   ├── HowItWorks.tsx
│   ├── BottomCta.tsx
│   └── LandingFooter.tsx
└── data/
    ├── values.ts
    ├── features.ts
    └── screens.ts
```

`LandingPage.tsx`는 위 8개 섹션을 단순 조립.

## 2. 상단 바 (LandingTopBar)

랜딩에서는 기존 [Header.tsx](../../../../restaurant-book-front/src/widgets/header/ui/Header.tsx)를 재사용하지 않는다 — 로그인용 메뉴/사용자 드롭다운이 비로그인 사용자에게는 시끄럽다.

| 좌측 | 가운데 | 우측 |
| --- | --- | --- |
| 로고 (홈) | (없음) | 언어선택 / 테마 / 로그인 / 회원가입 |

기존 [LanguageSelect](../../../../restaurant-book-front/src/shared/ui/LanguageSelect.tsx), [ThemeSwitcher](../../../../restaurant-book-front/src/widgets/header/ui/Header.tsx) 컴포넌트를 그대로 재사용.

> 구현 시 `Header.tsx`를 두 변종으로 나누지 말고, 별도 `LandingTopBar.tsx`로 만든다 (관심사 분리).

## 3. Hero 섹션

### 3.1 의도

7초 안에 "이 시스템이 식당 운영 어디를 해결하는지" 이해.

### 3.2 카피 (한국어 정본)

| 키 | 카피 |
| --- | --- |
| `landing.hero.eyebrow` | 식당 운영 통합 시스템 |
| `landing.hero.title` | 주문에서 결제까지, 실시간으로 흘러가게 |
| `landing.hero.subtitle` | 키오스크 주문, 주방 보드, 직원 결제, 매출까지 한 화면 안에서. 누락도 수기 정산도 없습니다. |
| `landing.hero.ctaPrimary` | 회원가입 시작하기 |
| `landing.hero.ctaSecondary` | 데모 화면 보기 |

`ctaSecondary`는 동일 페이지의 `#screens` 앵커(섹션 3)로 스무스 스크롤.

### 3.3 비주얼

- 우측(데스크톱) / 하단(모바일)에 **직원 보드 또는 주방 보드 캡처 1장**.
- `next/image` + `priority` (LCP 우선).
- 자리: `public/landing/hero.png`.

## 4. 핵심 가치 3개 카드 (ValueCards)

### 4.1 데이터 (실제 구현 기반)

```ts
// src/features/landing/data/values.ts
export const values = [
  {
    key: "realtime",
    titleKey: "landing.values.realtime.title",
    descKey: "landing.values.realtime.desc",
    icon: Activity,            // lucide
  },
  {
    key: "staffCall",
    titleKey: "landing.values.staffCall.title",
    descKey: "landing.values.staffCall.desc",
    icon: BellRing,
  },
  {
    key: "sales",
    titleKey: "landing.values.sales.title",
    descKey: "landing.values.sales.desc",
    icon: BarChart3,
  },
];
```

### 4.2 카피

| 키 | 카피 |
| --- | --- |
| `landing.values.realtime.title` | 실시간으로 흐르는 주문 |
| `landing.values.realtime.desc` | 고객이 주문하면 주방·직원 화면이 즉시 갱신됩니다. WebSocket으로 누락이 없습니다. |
| `landing.values.staffCall.title` | 직원을 부르는 가장 빠른 길 |
| `landing.values.staffCall.desc` | 손님이 키오스크에서 직원 호출, 수저/물/계산을 직접 선택. 같은 테이블 1분 중복 호출은 자동으로 차단됩니다. |
| `landing.values.sales.title` | 자동으로 쌓이는 매출 |
| `landing.values.sales.desc` | 결제수단별 합계와 환불을 자동 집계. 별도 영수증 정리 없이 매출 화면에서 확인합니다. |

## 5. 주요 화면 미리보기 (ScreensPreview, `id="screens"`)

### 5.1 데이터

```ts
export const screens = [
  { key: "customer", titleKey: "...", src: "/landing/screen-customer.png" },
  { key: "kitchen",  titleKey: "...", src: "/landing/screen-kitchen.png" },
  { key: "staff",    titleKey: "...", src: "/landing/screen-staff.png" },
];
```

### 5.2 표현

- 3-up 카드 (모바일은 1열).
- 각 카드: 화면 캡처 + 한 줄 설명 + (옵션) "더 보기" → 1차 가이드 `/guide/{role}`로 이동 (단, 비로그인이면 `/login?next=/guide/{role}`).

### 5.3 카피

| 키 | 카피 |
| --- | --- |
| `landing.screens.title` | 핵심 화면 미리보기 |
| `landing.screens.customer.title` | 고객 키오스크 |
| `landing.screens.customer.desc` | 메뉴 담기 → 매장/포장 → 주문. 직원 호출까지 한 화면. |
| `landing.screens.kitchen.title` | 주방 보드 |
| `landing.screens.kitchen.desc` | 접수·조리·완료를 카드 한 번 옮김으로 처리. |
| `landing.screens.staff.title` | 직원 결제 보드 |
| `landing.screens.staff.desc` | 준비 완료 주문 결제, 환불, 호출 응답을 한곳에서. |

## 6. 기능 목록 (FeatureList)

### 6.1 데이터 (12개 내외, 1·2차 MVP에서 실제 동작하는 것만)

```ts
export const features = [
  "kioskOrder",         // 키오스크 매장/포장 주문
  "stateFlow",          // 주문 상태 자동 흐름 (RECEIVED→...→COMPLETED)
  "websocket",          // 실시간 화면 갱신
  "staffBoard",         // 직원 보드 결제·환불·호출
  "kitchenBoard",       // 주방 보드 접수·조리·완료
  "noCookAuto",         // 조리 불필요 메뉴 자동 준비 완료
  "staffCall",          // 직원 호출 (기본 요청 + 직접 메시지)
  "salesAggregation",   // 매출 자동 집계 (결제수단별, 환불 분리)
  "tableManagement",    // 테이블 관리
  "menuManagement",     // 판매/세트 메뉴, 카테고리, 품절·노출
  "rolePermission",     // 역할/권한 관리
  "i18n",               // 4개 언어 (ko/en/ja/zh)
];
```

### 6.2 표현

- 2열 체크리스트 (`grid-cols-1 md:grid-cols-2`), 각 항목 앞에 ✓.
- 각 항목 1줄. 자세한 설명 없음.

### 6.3 카피 예시

| 키 | 카피 |
| --- | --- |
| `landing.features.kioskOrder` | 키오스크 매장/포장 주문 |
| `landing.features.staffCall` | 직원 호출 (수저·물·계산 + 직접 메시지) |
| `landing.features.salesAggregation` | 결제수단별 매출 + 환불 자동 분리 |
| ... | ... |

## 7. 도입 흐름 (HowItWorks)

3 step만.

| 단계 | 카피 |
| --- | --- |
| 1 | 회원가입 — 사장님 계정으로 가입합니다. |
| 2 | 메뉴 등록 — 카테고리, 메뉴, 세트를 등록합니다. |
| 3 | 운영 시작 — 키오스크 / 주방 / 직원 화면을 켭니다. |

## 8. 하단 CTA + Footer

- 큰 배너 한 칸: "지금 시작해보세요" + [회원가입] [로그인]
- Footer:
  - 회사명 / 연락 이메일 / 약관 / 개인정보처리방침 (페이지 미존재 시 `#`)
  - 사업자등록번호 등 법적 표기 (자리만 둠 — 실제 정보는 운영팀이 채움)

## 9. SEO / 메타

```tsx
// src/app/page.tsx 또는 src/app/(landing)/layout.tsx
export const metadata = {
  title: "RestaurantBook — 주문·주방·결제·매출을 한 화면에",
  description: "키오스크 주문부터 결제까지 실시간으로 흐르는 식당 운영 시스템.",
  openGraph: {
    title: "RestaurantBook",
    description: "주문에서 결제까지, 실시간으로 흘러가게.",
    images: ["/og.png"],
  },
};
```

서버 컴포넌트에서 metadata가 동작해야 하므로, `src/app/page.tsx`가 클라이언트 컴포넌트라면 metadata는 `src/app/layout.tsx`나 별도 라우트 그룹의 `layout.tsx`로 옮긴다.

## 10. 산출물

- [src/app/page.tsx](../../../../restaurant-book-front/src/app/page.tsx) (수정 — 비로그인 시 `<LandingPage />` 렌더)
- `src/features/landing/ui/LandingPage.tsx` 외 7개 섹션 컴포넌트
- `src/features/landing/data/{values,features,screens}.ts`
- `public/landing/hero.png`, `screen-customer.png`, `screen-kitchen.png`, `screen-staff.png`
- `public/og.png`
