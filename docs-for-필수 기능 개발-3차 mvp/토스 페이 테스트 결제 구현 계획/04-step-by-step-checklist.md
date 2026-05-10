# 04. 단계별 파일별 체크리스트

## 1단계: 백엔드 설정 추가

- [ ] `restaurant-book-server/src/main/resources/application.yaml`
  - [ ] `toss-payments.client-key`
  - [ ] `toss-payments.secret-key`
  - [ ] `toss-payments.api-base-url`
- [ ] `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/application/TossPaymentProperties.java`
  - [ ] `@ConfigurationProperties(prefix = "toss-payments")`
  - [ ] 설정 누락 여부 판단 메서드 추가

검증:

- [ ] 서버 부팅 성공
- [ ] 환경변수 미설정 시 고객 결제 설정 API가 명확한 오류 반환

## 2단계: 백엔드 결제 승인 API 추가

- [ ] `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/TossPaymentConfigResponse.java`
- [ ] `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/ConfirmTossPaymentRequest.java`
- [ ] `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/ConfirmTossPaymentResponse.java`
- [ ] `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/application/CustomerTossPaymentService.java`
- [ ] `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/CustomerPaymentController.java`

검증:

- [ ] `GET /api/customer/payments/config`가 client key만 반환
- [ ] `POST /api/customer/payments/toss/confirm`에서 DB 주문 금액과 요청 금액 비교
- [ ] 주문 상태가 `READY`가 아니면 실패
- [ ] 이미 결제 기록이 있으면 실패
- [ ] 토스 승인 성공 시 `Payment` 저장
- [ ] 토스 승인 성공 시 주문 `COMPLETED`

## 3단계: 보안 예외 추가

- [ ] `restaurant-book-server/src/main/java/com/cj/restaurantbook/config/SecurityConfig.java`
  - [ ] `GET /api/customer/payments/config` permitAll
  - [ ] `POST /api/customer/payments/toss/confirm` permitAll

검증:

- [ ] 비로그인 고객 키오스크에서도 결제 설정 조회 가능
- [ ] 비로그인 고객 키오스크에서도 토스 성공 후 승인 API 호출 가능

## 4단계: 프론트 결제 API 래퍼 추가

- [ ] `restaurant-book-front/src/entities/payment/model/customerPaymentTypes.ts`
- [ ] `restaurant-book-front/src/entities/payment/api/customerPaymentApi.ts`

검증:

- [ ] 타입 에러 없음
- [ ] axios baseURL 기존 설정 재사용

## 5단계: 토스 SDK 로더 추가

- [ ] `restaurant-book-front/src/shared/lib/tossPayments.ts`
  - [ ] v2 standard SDK script 동적 로드
  - [ ] 중복 로드 방지
  - [ ] 로드 실패 처리

검증:

- [ ] 브라우저에서 `window.TossPayments` 사용 가능
- [ ] SDK 로드 실패 시 토스트 표시

## 6단계: 고객 키오스크 결제 버튼 추가

- [ ] `restaurant-book-front/src/features/kiosk/KioskHome.tsx`
  - [ ] `CreditCard` 아이콘 추가
  - [ ] 결제 설정 query 추가
  - [ ] `READY` 주문 계산 추가
  - [ ] 결제 버튼 추가
  - [ ] 장바구니에 미접수 메뉴가 있으면 먼저 주문 접수 안내
  - [ ] 결제 진행 중 중복 클릭 방지

검증:

- [ ] READY 주문이 없으면 결제 버튼 비활성
- [ ] READY 주문 1건이면 토스 결제창 열림
- [ ] 결제 버튼이 직원 호출 왼쪽에 표시됨
- [ ] 모바일 폭에서 버튼 텍스트가 깨지지 않음

## 7단계: 결제 결과 페이지 추가

- [ ] `restaurant-book-front/src/app/customer/payment/success/page.tsx`
  - [ ] query string 검증
  - [ ] 승인 API 호출
  - [ ] 성공/실패 UI
  - [ ] `/customer` 복귀 버튼
- [ ] `restaurant-book-front/src/app/customer/payment/fail/page.tsx`
  - [ ] 실패 코드/메시지 표시
  - [ ] `/customer` 복귀 버튼

검증:

- [ ] 성공 리다이렉트 후 서버 승인 호출
- [ ] 승인 성공 후 주문 완료 표시
- [ ] 결제 취소 시 실패 페이지 표시

## 8단계: 환경변수 정리

- [ ] `docs-for-배포 가이드/.env.prod`
  - [ ] `TOSS_PAYMENTS_CLIENT_KEY=...`
  - [ ] `TOSS_PAYMENTS_SECRET_KEY=...`
  - [ ] `TOSS_PAYMENTS_SECURITY_KEY=...`

검증:

- [ ] EC2 `~/.env` 업로드 후 systemd에서 환경변수 인식
- [ ] 서버 재시작 후 결제 설정 API 정상 응답

## 9단계: 통합 테스트 시나리오

1. 고객 키오스크에서 메뉴 주문
2. 주방에서 주문 접수
3. 주방에서 조리 완료 처리
4. 고객 키오스크에 결제 버튼 활성화 확인
5. 토스 테스트 결제 진행
6. 성공 페이지에서 승인 처리 확인
7. 고객 주문 내역에서 `결제 완료` 확인
8. 직원 보드에서 `COMPLETED` 이동 확인
9. 매니저/매출 요약에 결제 금액 반영 확인

## 10단계: 후속 개선 후보

- [ ] 토스 `paymentKey` 저장 컬럼 추가
- [ ] 토스 결제 취소 API와 기존 환불 API 연결
- [ ] 결제 영수증 URL 저장
- [ ] 웹훅 검증과 비동기 상태 보정
- [ ] 여러 READY 주문 선택 결제 UI
- [ ] 결제수단별 토스 method 세분화

## 11단계: 실결제 전환 전 필수 검토

- [ ] 결제 핵심 테이블 구조 확정
  - [ ] `payments`: 결제 1건
  - [ ] `payment_orders`: 결제에 포함된 주문 연결
  - [ ] `payment_refunds`: 환불 이력
- [ ] `payment_orders.order_id` 유니크 제약 추가
  - [ ] 주문 금액을 쪼개는 분할 결제 제외
  - [ ] 결제 후 기준 `Order`와 `PaymentOrder`는 1:1
- [ ] `payments`에 PG 식별자 저장 컬럼 추가
  - [ ] `provider`
  - [ ] `provider_payment_key`
  - [ ] `provider_order_id`
  - [ ] `provider_method`
- [ ] 토스 결제 취소/환불 API를 기존 환불 API와 연결
- [ ] 웹훅 수신 및 서명/보안 검증 설계
- [ ] 결제 승인 성공 후 서버 장애가 발생하는 경우의 재조회/복구 절차 설계
- [ ] 전체 결제/선택 결제 API 정책 결정
  - [ ] 전체 결제: `READY` 주문 전체를 결제
  - [ ] 선택 결제: 고객이 선택한 주문만 결제
- [ ] 결제 성공 시 연결된 주문 수만큼 `COMPLETED` 이벤트 발행
- [ ] 테스트 키에서 라이브 키로 전환할 때 도메인/리다이렉트 URL/결제 UI 설정 점검
