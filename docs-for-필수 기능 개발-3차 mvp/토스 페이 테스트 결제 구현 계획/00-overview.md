# 00. 전체 개요

## 현재 코드 상태

프론트:

- 고객 키오스크 화면: `restaurant-book-front/src/features/kiosk/KioskHome.tsx`
- 주문 API 래퍼: `restaurant-book-front/src/entities/order/api/orderApi.ts`
- 결제/매출 API 래퍼: `restaurant-book-front/src/entities/payment/api/paymentApi.ts`
- 고객 주문 목록은 `orderApi.getActiveCustomerOrders(tableName)`로 조회한다.
- 우측 하단에는 현재 `직원 호출` 버튼과 설정 버튼이 있다.

백엔드:

- 운영 결제 완료 API: `restaurant-book-server/src/main/java/com/cj/restaurantbook/order/presentation/OperationsOrderController.java`
- 운영 결제 완료 서비스: `restaurant-book-server/src/main/java/com/cj/restaurantbook/order/application/OperationsOrderService.java`
- 결제 엔티티: `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/domain/Payment.java`
- 결제 저장소: `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/infrastructure/PaymentRepository.java`
- 결제 완료는 이미 `Payment.paid(order, paymentMethod, handledBy)` 저장 후 `Order.complete()` 처리 구조가 있다.

## 결제 흐름

1. 고객이 주문을 접수한다.
2. 주방/직원이 주문을 처리해서 주문 상태가 `READY`가 된다.
3. 고객 키오스크 우측 하단에 `결제` 버튼이 활성화된다.
4. 고객이 `결제` 버튼을 누르면 토스페이먼츠 결제창을 연다.
5. 토스 결제 인증 성공 시 `successUrl`로 돌아온다.
6. 프론트 성공 페이지가 백엔드 `confirm` API를 호출한다.
7. 백엔드는 DB 주문 금액과 토스 리다이렉트 금액을 비교한다.
8. 백엔드는 토스 승인 API를 시크릿 키로 호출한다.
9. 승인 성공 시 기존 결제 기록을 저장하고 주문을 `COMPLETED`로 바꾼다.
10. 기존 주문 웹소켓/폴링 흐름으로 고객/직원 화면에 결제 완료가 반영된다.

## 범위

이번에 포함:

- 토스 테스트 키 기반 1회성 카드/간편결제 테스트
- 고객 키오스크 `결제` 버튼 추가
- 결제 설정 조회 API
- 결제 승인 API
- 금액/주문상태 서버 검증
- 기존 `Payment`/매출 집계 연동

이번에 제외:

- 토스 결제 취소/환불 API 연동
- 웹훅 기반 비동기 결제 처리
- 가상계좌 입금 대기 처리
- 영수증 상세 저장
- 토스 `paymentKey` DB 컬럼 영구 저장

## 중요한 보안 원칙

- `test_sk_...` 시크릿 키는 프론트 코드, `NEXT_PUBLIC_*`, 브라우저 응답에 절대 넣지 않는다.
- 결제 승인 전 금액은 반드시 서버 DB의 주문 금액과 비교한다.
- 프론트의 결제 성공 여부만 믿고 주문을 완료 처리하지 않는다.
- 토스 승인 API 인증 헤더는 `Basic base64(SECRET_KEY:)` 형식을 사용한다.

