# RestaurantBook

한식당을 위한 키오스크 주문 관리 + 반찬 쇼핑몰 운영 프로젝트입니다.

기존 인증/인가 보일러플레이트를 기반으로 가져왔고, 프로젝트명·패키지명·포트·DB명을 RestaurantBook 기준으로 정리했습니다.

## Implementation Readiness

현재 상태는 **식당 키오스크 + 식당 온오프라인 쇼핑몰 구현을 시작해도 되는 단계**입니다.

이미 인증, 인가, 관리자 메뉴, 권한, 사용자 관리, 사이트 설정, 파일 업로드 같은 공통 운영 기반이 잡혀 있어 도메인 기능을 얹기 좋은 구조입니다. 다만 키오스크 주문, 쇼핑몰 상품/주문/결제/배송, 매장 재고 같은 실제 식당 도메인은 아직 구현 전이므로, 바로 화면부터 만들기보다는 아래 MVP 경계부터 확정하고 순서대로 붙이는 방식이 적절합니다.

검토 기준:

- Backend 테스트 통과: `./gradlew test`
- Frontend lint 통과: `npm run lint`
- Frontend production build 통과: `npm run build`
- 현재 구현 범위는 공통 관리자/인증 기반이며, 키오스크·쇼핑몰 도메인은 신규 개발 대상

## Stack

| 영역 | 스택 |
| --- | --- |
| Frontend | Next.js 16, React 19, Tailwind v4, TanStack Query |
| Backend | Spring Boot, Spring Security, Spring Data JPA, JWT |
| DB | PostgreSQL 15 |
| Infra | Docker Compose |

## Ports

| 서비스 | URL |
| --- | --- |
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:4201 |
| Swagger | http://localhost:4201/swagger-ui/index.html |
| Postgres host | localhost:5435 |

## Run

```bash
docker compose up -d postgres
```

```bash
cd restaurant-book-server
./gradlew bootRun
```

```bash
cd restaurant-book-front
npm install
npm run dev
```

## Current Base Features

- JWT 로그인 / 회원가입
- 유저, 역할, 권한, 권한 카테고리 관리
- 역할-권한 매핑
- DB 기반 헤더 메뉴 관리
- 테마 스위처
- 한국어 / 영어 / 일본어 / 중국어 i18n
- S3 presigned upload API

## Default Roles

기본 롤은 `RoleSeeder`에서 관리합니다. 역할 관리 기능이 보일러플레이트의 기본 기능이므로, 다른 프로젝트로 재사용할 때는 이 초기 롤 목록과 회원가입 기본 롤만 프로젝트 성격에 맞게 바꾸면 됩니다.

RestaurantBook 기본 롤:

- `ROLE_ADMIN`: 시스템 전체 관리자
- `ROLE_MANAGER`: 매장 및 쇼핑몰 운영 관리자
- `ROLE_KITCHEN`: 주방 주문 접수 및 조리 상태 관리자
- `ROLE_STAFF`: 매장 주문 및 현장 운영 담당자
- `ROLE_CUSTOMER`: 쇼핑몰 주문 고객

회원가입 기본 롤:

- 기본값: `ROLE_CUSTOMER`
- 환경변수 `SIGNUP_DEFAULT_ROLE`로 변경 가능

로컬 개발용 테스트 계정도 기본 생성됩니다.

| 롤 | 이메일 | 비밀번호 |
| --- | --- | --- |
| `ROLE_ADMIN` | `admin@restaurantbook.local` | `password123` |
| `ROLE_MANAGER` | `manager@restaurantbook.local` | `password123` |
| `ROLE_KITCHEN` | `kitchen@restaurantbook.local` | `password123` |
| `ROLE_STAFF` | `staff@restaurantbook.local` | `password123` |
| `ROLE_CUSTOMER` | `customer@restaurantbook.local` | `password123` |

테스트 계정 생성은 환경변수로 제어할 수 있습니다.

```bash
SEED_TEST_ACCOUNTS_ENABLED=false
SEED_TEST_ACCOUNTS_PASSWORD=change-me
SEED_TEST_ACCOUNTS_EMAIL_DOMAIN=example.local
```

운영 환경에서는 `SEED_TEST_ACCOUNTS_ENABLED=false`로 끄는 것을 권장합니다.

## Restaurant Domain Scope

RestaurantBook은 크게 두 축으로 구현합니다.

### 1. 매장 키오스크 / 주문 운영

- 메뉴 카테고리 / 메뉴 상품 / 옵션 관리
- 키오스크 주문 생성
- 테이블 번호 또는 픽업 번호 기반 주문 식별
- 주문 상태 관리: 접수, 조리중, 완료, 취소
- 주방 접수 보드
- 매장 결제 연동 또는 결제 완료 수동 처리
- 품절 / 판매중지 / 영업시간 제어

### 2. 온오프라인 반찬 쇼핑몰

- 반찬 상품 / 상품 옵션 / 이미지 관리
- 온라인 장바구니
- 온라인 주문 / 결제 / 배송 상태 관리
- 오프라인 판매 주문 기록
- 재고 차감 / 재고 보정 / 품절 처리
- 매장 판매와 온라인 판매 재고 통합

## Recommended MVP Order

1. **상품/메뉴 공통 모델 정리**
   - 키오스크 메뉴와 쇼핑몰 상품을 완전히 분리할지, 공통 `Product` 기반으로 두고 판매 채널만 나눌지 결정합니다.
   - 추천: 초기에는 `Product`를 공통으로 두고 `salesChannel`, `productType`, `displayOrder`, `stockTracked` 같은 속성으로 키오스크/쇼핑몰 노출을 제어합니다.

2. **관리자 상품 관리**
   - 상품 카테고리, 상품, 옵션, 이미지, 판매 상태, 재고 사용 여부를 먼저 구현합니다.
   - 기존 관리자 레이아웃, 권한, 업로드 API를 그대로 활용할 수 있습니다.

3. **키오스크 주문 MVP**
   - 고객용 메뉴 조회, 장바구니형 주문 작성, 주문 생성, 주문 상태 변경 API를 구현합니다.
   - 주방 보드는 실시간 연동 전에도 polling 기반으로 먼저 동작시킬 수 있습니다.

4. **쇼핑몰 주문 MVP**
   - 상품 목록, 상품 상세, 장바구니, 주문 생성, 배송지, 주문 상태를 구현합니다.
   - 실제 결제 PG는 주문 플로우가 안정된 뒤 붙이는 것이 좋습니다.

5. **재고 통합**
   - 키오스크 주문과 쇼핑몰 주문이 같은 재고를 차감하도록 정리합니다.
   - 취소/환불/주문 실패 시 재고 복구 규칙을 함께 설계합니다.

6. **결제 / 알림 / 운영 고도화**
   - PG 결제, 주문 알림, 영수증, 매출 집계, 쿠폰, 포인트, 영업시간, 품절 자동화 등을 추가합니다.

## First Development Targets

첫 개발 단위는 아래 정도로 잡는 것이 적절합니다.

- Backend
  - `product_category`
  - `product`
  - `product_option`
  - `order`
  - `order_item`
  - `inventory_transaction`

- Frontend
  - 관리자 상품 관리 페이지
  - 키오스크 메뉴 선택 페이지
  - 주방 주문 보드
  - 쇼핑몰 상품 목록 / 상세 / 장바구니 / 주문 페이지

## Important Decisions Before Coding

- 키오스크 메뉴와 쇼핑몰 상품을 같은 상품 테이블로 관리할지 여부
- 옵션 구조: 단일 선택, 다중 선택, 필수 옵션, 추가 금액 지원 범위
- 결제 방식: MVP에서 수동 결제 완료 처리 후 PG 연동할지 여부
- 재고 기준: 메뉴 단위 재고인지, 반찬 상품 단위 재고인지, 원재료 재고까지 볼지 여부
- 주문 채널: `KIOSK`, `ONLINE`, `OFFLINE_POS` 구분 필요 여부
- 실시간성: 주방 보드를 WebSocket으로 바로 갈지, polling으로 먼저 갈지 여부
- 운영자 권한: 상품 관리자, 주문 관리자, 슈퍼 관리자 권한 분리 범위
