# RestaurantBook 3차 MVP 구현 현황

작성일: 2026-05-10

## 기준

최근 커밋:

| 커밋 | 내용 |
| --- | --- |
| `f48dda7` | 키오스크 카테고리 구분선 추가 및 판매 메뉴 관리 UI 개선 |
| `80f4ee6` | SelectInput portal 에러 수정 |
| `c1e305e` | 토스페이먼츠 결제 연동 및 주문/결제 기능 전반 개선 |
| `fa12416` | 판매 메뉴 수정 폼 카테고리 미표시 버그 수정 |
| `2ad5778` | 매출 통계 카드 색상 구분 및 전체 기능 개선 |
| `a22fc1b` | 관리자 일정 관리 기능 및 UI 개선 |

참고 문서:

| 문서 | 내용 |
| --- | --- |
| `docs-for-필수 기능 개발-3차 mvp/일정 관리 기능 구현 계획` | 관리자 운영 일정 관리 도메인/API/UI 계획 |
| `docs-for-필수 기능 개발-3차 mvp/다국어 기능 적용 for 로그인 페이지` | 로그인/회원가입 진입 동선 다국어 정리 |
| `docs-for-필수 기능 개발-3차 mvp/토스 페이 테스트 결제 구현 계획` | 고객 키오스크 토스 테스트 결제 구현 및 배포 현황 |
| `docs-for-필수 기능 개발-3차 mvp/판매 메뉴 카테고리별 순서 바꾸기 구현 계획` | 판매 메뉴 카테고리 탭 및 카테고리 내부 메뉴 순서 조절 |
| `docs-for-필수 기능 개발-3차 mvp/고객 페이지 전체 조회 (순서 고려)` | 고객 키오스크 전체 보기와 카테고리 섹션 렌더링 |

## 1. 완료 체크리스트

### 1.1 관리자 일정 관리

- [x] `admin_calendar` 백엔드 패키지 추가
- [x] `admin_calendar_entries` 엔티티/Repository/Service 추가
- [x] 일정 타입 `NOTICE`, `HOLIDAY`, `EVENT`, `MEMO` 지원
- [x] `createdBy`, `createdByName`, `updatedBy` 저장 구조 추가
- [x] 일정 조회/등록/수정/삭제 API 추가
- [x] 관리자 권한 기준 `/api/admin/calendar/entries` 보호
- [x] 일정 기간 범위, 제목 필수, 없는 일정 예외 처리
- [x] `AdminCalendarServiceTest` 추가
- [x] 프론트 `admin-calendar` entity/API/hook 추가
- [x] `/admin/calendar` 월간 캘린더 화면 추가
- [x] 일정 목록, 날짜 필터, 등록/수정/삭제 다이얼로그 추가
- [x] 헤더 fallback 메뉴와 `NavigationMenuSeeder`에 `ADMIN_CALENDAR` 추가
- [x] 관리자 대시보드 운영 관리 바로가기 연결

관련 API:

- `GET /api/admin/calendar/entries?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `POST /api/admin/calendar/entries`
- `PUT /api/admin/calendar/entries/{entryId}`
- `DELETE /api/admin/calendar/entries/{entryId}`

관련 파일:

- `restaurant-book-server/src/main/java/com/cj/restaurantbook/admin_calendar`
- `restaurant-book-server/src/test/java/com/cj/restaurantbook/admin_calendar/application/AdminCalendarServiceTest.java`
- `restaurant-book-front/src/entities/admin-calendar`
- `restaurant-book-front/src/app/admin/calendar`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/config/NavigationMenuSeeder.java`
- `restaurant-book-front/src/widgets/header/ui/Header.tsx`

### 1.2 로그인 페이지 다국어

- [x] 로그인 화면 테이블 선택 문구를 i18n key로 이동
- [x] 고객 로그인 시 테이블 미선택 에러 다국어 처리
- [x] 테스트 계정 제목/역할/진행/성공/실패 문구 다국어 처리
- [x] 테이블 선택 모달 제목/설명/검색/빈 상태/닫기 문구 다국어 처리
- [x] AuthLayout 서비스 소개 버튼과 이미지 alt 다국어 처리
- [x] `LanguageSelect`/공통 접근성 라벨용 `common` key 확인
- [x] `ko`, `en`, `ja`, `zh` 4개 언어 리소스 확장

관련 파일:

- `restaurant-book-front/src/shared/i18n/resources/{ko,en,ja,zh}/auth.ts`
- `restaurant-book-front/src/shared/i18n/resources/{ko,en,ja,zh}/common.ts`
- `restaurant-book-front/src/features/auth/login/LoginForm.tsx`
- `restaurant-book-front/src/features/auth/test-login/TestLoginButtons.tsx`
- `restaurant-book-front/src/features/table-picker/TablePickerDialog.tsx`

### 1.3 토스페이먼츠 테스트 결제

- [x] 고객 키오스크 `READY` 주문 결제 버튼 추가
- [x] 단건 결제와 여러 `READY` 주문 묶음 결제 지원
- [x] 토스 SDK 동적 로더 추가
- [x] 결제 성공/실패 리다이렉트 페이지 추가
- [x] 브라우저에는 client key만 내려주는 설정 API 추가
- [x] 서버에서 토스 승인 API 호출
- [x] DB 주문 금액과 토스 리다이렉트 금액 비교
- [x] `READY` 주문만 결제 가능하도록 검증
- [x] 승인 성공 시 `Payment` 1건과 `PaymentOrder` N건 저장
- [x] 연결된 주문 N건을 `COMPLETED`로 전환
- [x] 주문 변경 이벤트를 주문 수만큼 발행
- [x] 같은 토스 `paymentKey` 중복 confirm 방어
- [x] 기존 직원 수동 결제도 `Payment` + `PaymentOrder` 구조로 정리
- [x] `PaymentRefund` 최소 구조 추가
- [x] `PaymentSchemaMigrator`로 운영 DB 스키마 보정
- [x] `PaymentMethod`에 `EASY_PAY`, `TRANSFER` 추가
- [x] `provider`, `providerMethod`, PG 식별자 저장 구조 추가
- [x] 직원 보드 결제 완료 카드에 결제수단 배지 표시
- [x] 매출 통계에 간편결제/계좌이체 분류 반영
- [x] 운영 배포 반영 및 CloudFront 무효화 완료

관련 API:

- `GET /api/customer/payments/config`
- `POST /api/customer/payments/toss/confirm`

관련 파일:

- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/application/CustomerTossPaymentService.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/application/TossPaymentProperties.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/CustomerPaymentController.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/domain/Payment.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/domain/PaymentOrder.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/domain/PaymentRefund.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/infrastructure/PaymentSchemaMigrator.java`
- `restaurant-book-front/src/entities/payment/api/customerPaymentApi.ts`
- `restaurant-book-front/src/entities/payment/model/customerPaymentTypes.ts`
- `restaurant-book-front/src/shared/lib/tossPayments.ts`
- `restaurant-book-front/src/app/customer/payment/success/page.tsx`
- `restaurant-book-front/src/app/customer/payment/fail/page.tsx`
- `restaurant-book-front/src/features/kiosk/KioskHome.tsx`

### 1.4 판매 메뉴 카테고리별 순서 조절

- [x] 판매 메뉴 목록에 카테고리 탭 추가
- [x] 탭 라벨을 `전체 (n)`, `식사 (n)` 형식으로 표시
- [x] 카테고리 탭 선택을 기존 `categoryId` 필터와 연결
- [x] 전체 탭에서는 카테고리 순서와 메뉴 순서 기준으로 읽기 표시
- [x] 특정 카테고리 탭에서만 메뉴 DnD 순서 조절 허용
- [x] 메뉴 순서 저장 시 `displayOrder`를 재계산해 업데이트
- [x] 순서 저장 후 `sale-menus`, `customer-sale-products` 캐시 무효화
- [x] 수정폼에서 숫자형 `정렬 순서` 입력 제거
- [x] 수정 다이얼로그 우상단 닫기 버튼 추가

관련 파일:

- `restaurant-book-front/src/features/sale-menu-management/SaleMenuCategoryTabs.tsx`
- `restaurant-book-front/src/features/sale-menu-management/SaleMenuManagement.tsx`
- `restaurant-book-front/src/features/sale-menu-management/SaleMenuTable.tsx`
- `restaurant-book-front/src/features/sale-menu-management/SaleMenuFormDialog.tsx`

### 1.5 고객 키오스크 전체 보기

- [x] 고객 키오스크 카테고리 버튼 마지막에 `전체 보기` 추가
- [x] 기본 선택은 첫 번째 실제 카테고리로 유지
- [x] 세트 탭은 일반 카테고리 뒤에 표시
- [x] 전체 보기 조회 시 `section=ALL` 사용
- [x] 전체 보기에서 카테고리 섹션 단위로 메뉴 렌더링
- [x] 섹션 순서는 관리자 카테고리 `displayOrder` 기준으로 정렬
- [x] 세트 메뉴는 별도 `세트 메뉴` 섹션으로 그룹화
- [x] 전체 보기에서도 기존 메뉴 담기/수량 변경 흐름 재사용
- [x] 카테고리 구분선과 섹션 제목 스타일 개선

관련 파일:

- `restaurant-book-server/src/main/java/com/cj/restaurantbook/customer_menu`
- `restaurant-book-front/src/entities/customer-sale-product`
- `restaurant-book-front/src/features/kiosk/KioskHome.tsx`

## 2. 검증 현황

토스 결제 구현 문서 기준 완료:

- [x] 백엔드 `./gradlew build -x test`
- [x] 백엔드 `./gradlew test`
- [x] 프론트 `npm run build`
- [x] 프론트 `npm run lint`
- [x] 운영 `GET https://smart-fnb-design.com/api/site-settings`
- [x] 운영 `GET https://smart-fnb-design.com/api/customer/payments/config`
- [x] 운영 고객 페이지 응답 확인
- [x] CloudFront 캐시 무효화 완료

코드 기준 확인:

- [x] `AdminCalendarServiceTest` 존재
- [x] `PaymentOrder`, `PaymentRefund`, `PaymentSchemaMigrator` 존재
- [x] 토스 결제 성공/실패 페이지 존재
- [x] 로그인 다국어 key 4개 언어 반영
- [x] 판매 메뉴 카테고리 탭 컴포넌트 존재
- [x] 고객 키오스크 `전체 보기` 탭 및 섹션 렌더링 존재

이번 정리 작업에서 명령 검증은 재실행하지 않았다.

## 3. 해야 할 일 추천

### P0. 토스 결제 운영 시나리오 추가 검증

- [ ] 운영 도메인에서 READY 주문 1건 토스 테스트 결제 성공 확인
- [ ] 운영 도메인에서 READY 주문 여러 건 합산 결제 성공 확인
- [ ] 운영 도메인에서 일부 주문 선택 결제 성공 확인
- [ ] 결제 후 고객/직원 화면에서 `COMPLETED` 즉시 반영 확인
- [ ] 매출 통계에 `EASY_PAY`와 `providerMethod` 표시 확인
- [ ] 중복 confirm 재호출 케이스 재검증

### P0. 결제 마이그레이션 안정성 확인

- [ ] 운영 DB 백업 정책 확인
- [ ] `payment_orders` 기존 결제 backfill 결과 확인
- [ ] `payment_orders.order_id` 유니크 제약 확인
- [ ] `payment_refunds` 테이블 생성 확인
- [ ] `PaymentSchemaMigrator` 반복 실행 시 부작용 없는지 확인

### P1. 일정 관리 회귀 검증

- [ ] 관리자 계정으로 `/admin/calendar` 진입 확인
- [ ] 일정 등록/수정/삭제 후 화면 즉시 갱신 확인
- [ ] CUSTOMER 직접 접근 차단 확인
- [ ] KST 자정 경계 확인
- [ ] DB 인덱스 2개와 FK 제약 확인
- [ ] `ROLE_MANAGER` 공개 여부 결정

### P1. 판매 메뉴/고객 전체 보기 회귀 검증

- [ ] 특정 카테고리 메뉴 DnD 저장 후 새로고침 유지 확인
- [ ] 전체 탭에서 DnD 핸들이 숨겨지는지 확인
- [ ] 검색/상태/노출 필터 사용 시 DnD 비활성 확인
- [ ] 고객 전체 보기 섹션 순서가 관리자 카테고리 순서와 일치하는지 확인
- [ ] 전체 보기에서 주문 담기/수량/금액 갱신 회귀 확인
- [ ] 매장/포장 전환 시 전체 보기 메뉴가 정상 갱신되는지 확인

### P1. 로그인 다국어 UI 확인

- [ ] `/login` 4개 언어 전환 시 하드코딩 한글 잔존 여부 확인
- [ ] 테이블 선택 모달 4개 언어 레이아웃 확인
- [ ] 테스트 계정 버튼 4개 언어 레이아웃 확인
- [ ] 서버 에러 fallback이 사용자 언어와 섞이지 않는지 확인

### P2. 결제 고도화

- [ ] 토스 결제 취소 API를 기존 환불 API와 연결
- [ ] `PaymentRefund` 이력 저장 정책 확정
- [ ] 웹훅 수신 및 서명/보안 검증 설계
- [ ] 결제 상태 재조회/복구 절차 설계
- [ ] 테스트 키에서 라이브 키 전환 시 도메인/리다이렉트 URL/결제 UI 설정 점검

## 현재 판단

3차 MVP의 핵심 기능은 구현 완료로 판단한다.

완료 처리 가능한 항목:

- 관리자 일정 관리
- 로그인 진입 동선 다국어
- 토스 테스트 결제 기본 흐름
- 다건 READY 주문 묶음 결제
- 결제 도메인 `Payment`/`PaymentOrder` 구조 확장
- 결제수단 분류 `EASY_PAY`/`TRANSFER` 반영
- 판매 메뉴 카테고리 탭과 카테고리 내부 DnD
- 고객 키오스크 `전체 보기` 섹션 렌더링

후속 보강으로 남길 항목:

- 운영 토스 테스트 결제 시나리오 추가 수동 검증
- 토스 환불 API, 웹훅, 상태 보정
- 결제 마이그레이션 운영 DB 결과 확인
- 일정 관리 DB 제약/인덱스 확인
- 판매 메뉴 DnD와 고객 전체 보기 브라우저 회귀 확인
- 로그인 다국어 레이아웃 회귀 확인

추천 순서는 `운영 토스 결제 시나리오 검증 -> 결제 마이그레이션 확인 -> 판매 메뉴/고객 전체 보기 회귀 확인 -> 일정 관리 권한/DB 확인 -> 로그인 다국어 레이아웃 확인`이다.
