# RestaurantBook 1차 MVP 완료 기록

작성일: 2026-05-08

## 완료 요약

1차 MVP는 고객 키오스크 주문부터 주방 처리, 직원 결제 완료, 매니저/관리자 조회 화면까지 실제 데이터 흐름으로 연결한 상태다.

주문은 삭제하지 않고 상태로 활성/비활성을 구분한다.

- 활성 주문: `RECEIVED`, `ACCEPTED`, `COOKING`, `READY`
- 비활성 주문: `COMPLETED`, `CANCELED`
- `COMPLETED`: 결제 완료 및 주문 종료
- 별도 서빙 완료 상태는 만들지 않음

## 구현 체크리스트

### 고객 키오스크

- [x] 고객 메뉴 조회
- [x] 매장/포장 주문 생성
- [x] 테이블명 기반 활성 주문 조회
- [x] 고객 주문 취소
- [x] 취소 메시지 고객 페이지 노출
- [x] 활성 주문 기준을 상태로 제한
- [x] `COMPLETED`, `CANCELED` 주문은 active 목록에서 제외
- [x] 주문 삭제 없이 상태 변경으로 운영

### 주방 화면

- [x] 주방 주문 보드 구현
- [x] `RECEIVED -> ACCEPTED`
- [x] `ACCEPTED -> COOKING`
- [x] `COOKING -> READY`
- [x] 주방 취소 처리
- [x] `READY`까지 주방 보드에서 관리
- [x] 결제 완료 후 주방 보드에서 자연스럽게 제외

### 직원 화면

- [x] 직원 주문 보드 구현
- [x] `ACCEPTED`, `COOKING`, `READY`, `COMPLETED` 컬럼 표시
- [x] `READY` 주문 결제 완료 처리
- [x] 결제수단 선택 UI 추가
- [x] 결제수단 `CARD`, `CASH`, `ETC` 지원
- [x] 결제 완료 후 `Order READY -> COMPLETED`
- [x] 결제 완료 컬럼 이동
- [x] 운영 취소 처리

### Payment 도메인

- [x] `Payment` entity 추가
- [x] `payments` 테이블 추가
- [x] `PaymentMethod` enum 추가
- [x] `PaymentStatus` enum 추가
- [x] 결제 완료 API에서 Payment 생성
- [x] Payment 생성과 Order `COMPLETED` 처리를 하나의 트랜잭션으로 처리
- [x] 주문별 중복 결제 방지
- [x] 주문 row lock으로 동시 결제 경합 완화
- [x] PG 연동 없이 MVP 현장 결제 기록으로 구현

### WebSocket 전파

- [x] 서버 WebSocket 핸들러 추가
- [x] 주문 변경 이벤트 afterCommit 전파
- [x] 운영 화면 topic 전파
- [x] 고객 테이블별 topic 전파
- [x] 주방 보드 실시간 반영
- [x] 직원 보드 실시간 반영
- [x] 고객 active 주문 목록 실시간 반영
- [x] 결제 완료 수신 시 고객 active 캐시 즉시 제거
- [x] polling은 fallback/보정용으로 유지

### 매출 관리

- [x] 오늘 매출 요약 API 추가
- [x] 기간별 매출 상세 API 추가
- [x] `/sales` 페이지 구현
- [x] 기간 필터 구현
- [x] 총 매출 표시
- [x] 결제 건수 표시
- [x] 결제수단별 매출 표시
- [x] 최근 결제 목록 표시
- [x] 취소/환불 영역은 MVP placeholder로 0원 표시
- [x] `/sales` 뒤로 가기 버튼 추가
- [x] `/sales` window focus 시 자동 최신화

### 매니저 페이지

- [x] `/manager` placeholder 제거
- [x] 실데이터 기반 매니저 대시보드 구현
- [x] 오늘 주문 표시
- [x] 오늘 매출 표시
- [x] 결제 대기 표시
- [x] 결제 완료 표시
- [x] 실시간 주문 흐름 표시
- [x] 오늘 결제수단별 매출 표시
- [x] 직원 보드, 주방 현황, 매출 상세, 품절/노출 관리 바로가기
- [x] WebSocket 주문 변경 시 매니저 대시보드 갱신

### 관리자 페이지

- [x] 운영 지표 중심 화면에서 관리자 콘솔로 재정리
- [x] 유저 수 표시
- [x] 롤 수 표시
- [x] 권한 수 표시
- [x] 내비게이션 메뉴 수 표시
- [x] 사람·권한 관리 바로가기
- [x] 상품·키오스크 관리 바로가기
- [x] 설정 관리 바로가기
- [x] 운영 화면 바로가기 제공

## 주요 API

### 주문

- `POST /api/customer/orders`
- `GET /api/customer/orders/active`
- `GET /api/customer/orders/canceled`
- `PATCH /api/customer/orders/{orderId}/cancel`
- `GET /api/kitchen/orders`
- `PATCH /api/kitchen/orders/{orderId}/accept`
- `PATCH /api/kitchen/orders/{orderId}/start-cooking`
- `PATCH /api/kitchen/orders/{orderId}/ready`
- `GET /api/operations/orders`
- `PATCH /api/operations/orders/{orderId}/complete`
- `PATCH /api/operations/orders/{orderId}/cancel`

### 매출

- `GET /api/sales/today-summary`
- `GET /api/sales?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

### 매니저

- `GET /api/manager/dashboard`

## 검증 결과

- [x] `./gradlew test`
- [x] `npm run lint`
- [x] `npm run build`
- [x] `git diff --check`

## 남은 작업 후보

- [ ] 실제 태블릿에서 고객 페이지 WebSocket 반영 시간 확인
- [ ] 관리자 콘솔과 매니저 대시보드 메뉴 권한 구조 추가 정리
- [ ] 주문 관리 상세 페이지 구현
- [ ] 결제 취소/환불 도메인 구현
- [ ] 매출 CSV 내보내기
- [ ] 매출 차트 구현
- [ ] 주방/직원/매니저 화면 E2E 테스트 추가
