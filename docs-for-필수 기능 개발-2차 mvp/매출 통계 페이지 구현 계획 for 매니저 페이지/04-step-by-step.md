# 04. 단계별 작업 순서 + 검증 체크리스트

작성일: 2026-05-08

## 권장 작업 순서

이번 기능은 새 도메인 개발이 아니라 기존 매출 조회 계약을 검증하고 UI를 다듬는 작업이다. 1개 PR로 처리해도 충분하다.

### Step 1. 백엔드 계약 확인

파일:

- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/domain/Payment.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/infrastructure/PaymentRepository.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/application/SalesService.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/SalesController.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/SalesSummaryResponse.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/SalesResponse.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/payment/presentation/dto/PaymentListItemResponse.java`

작업:

1. `GET /api/sales/today-summary` 응답에 `refundAmount/refundCount`가 포함되는지 확인한다.
2. `GET /api/sales` 응답에 `recentPayments/refundedPayments`가 포함되는지 확인한다.
3. 결제 집계는 `paidAt`, 환불 집계는 `refundedAt` 기준인지 확인한다.
4. 결제수단별 매출은 `PAID`만 포함하는지 확인한다.
5. 결제수단별 요약은 `CARD/CASH/ETC` 3개가 항상 반환되는지 확인한다.
6. `REFUNDED` 결제의 `refundedAt`은 null이 될 수 없도록 검증한다.

필수 테스트:

1. `SalesServiceTest`를 추가한다.
2. 환불 집계가 `paidAt`이 아니라 `refundedAt` 기준임을 테스트한다.
3. 최근 결제/환불 목록이 각각 50건으로 제한되는지 테스트한다.
4. 비매니저 계정은 `/api/sales`, `/api/sales/today-summary`에 접근할 수 없는지 통합 테스트로 확인한다.

검증:

- `./gradlew test`
- Swagger UI에서 `Sales` API 응답 확인

### Step 2. 프론트 타입/API 확인

파일:

- `restaurant-book-front/src/entities/payment/model/types.ts`
- `restaurant-book-front/src/entities/payment/api/paymentApi.ts`

작업:

1. `SalesSummary`에 `refundAmount/refundCount`가 있는지 확인한다.
2. `SalesResponse`에 `refundedPayments`가 있는지 확인한다.
3. `PaymentListItem`에 `refundedAt/refundedBy`가 있는지 확인한다.
4. `getSales({ startDate, endDate })`가 기존 API와 맞는지 확인한다.

검증:

- `npm run lint`
- TypeScript 오류 없음

### Step 3. `/sales` 통계 UI 재구성

파일:

- `restaurant-book-front/src/app/sales/page.tsx`

작업:

1. 제목을 `매출 통계`로 변경한다.
2. 기간 필터에서 날짜 직접 수정 시 `CUSTOM` 상태로 전환한다.
3. 시작일이 종료일보다 뒤로 가지 않게 보정한다.
4. 핵심 지표 카드를 `총 매출 / 순매출 / 결제 건수 / 환불` 구조로 바꾼다.
5. 결제수단별 매출에 비중 표시를 추가한다.
6. 최근 결제 목록과 최근 환불 목록의 빈 상태를 정리한다.
7. 최근 결제/환불 목록 제목 또는 설명에 `최근 50건` 제한을 명시한다.
8. 환불 목록은 `refundedAt`을 사용하고 `paidAt` fallback을 제거한다.
9. 순매출 음수 상태의 색상/부호 규칙을 적용한다.
10. 모바일 폭에서 카드/테이블이 겹치지 않는지 조정한다.

검증:

- `/sales` 진입.
- 오늘/최근 7일/이번 달/직접 선택 필터 동작.
- 결제 데이터 없음 상태.
- 결제 데이터 있음 상태.
- 환불 데이터 없음 상태.
- 환불 데이터 있음 상태.
- 순매출 음수 상태.
- 결제/환불 목록 50건 초과 상태.

### Step 4. `/manager` 진입점 조정

파일:

- `restaurant-book-front/src/app/manager/page.tsx`

작업:

1. `매출 상세` 라벨을 `매출 통계`로 맞춘다.
2. 오늘 매출 카드 보조 문구를 결제 건수 중심으로 정리한다.
3. `결제 완료` 카드를 `오늘 순매출` 카드로 교체할지 결정한다.
4. 오늘 결제수단 영역에 데이터 없음 상태를 추가한다.
5. 결제/환불 mutation 성공 후 `["sales"]` 쿼리를 invalidate해 오늘 매출 요약을 즉시 갱신한다.

권장 구현:

- `결제 완료` 카드를 `오늘 순매출`로 교체한다.
- 값은 `todaySales.totalAmount - todaySales.refundAmount`.
- 보조 문구는 `환불 N건`.

검증:

- `/manager` 진입.
- 오늘 매출 카드 클릭 시 `/sales` 이동.
- 순매출 또는 환불 카드가 오늘 요약 API와 일치.
- 결제/환불 직후 같은 브라우저의 `/manager` 매출 카드가 갱신된다.
- 기존 주문 흐름/직원 호출 카드 회귀 없음.

### Step 5. 수동 시나리오 검증

시나리오:

1. 고객 화면에서 주문 생성.
2. 직원 보드에서 주문 접수/준비 완료/결제 완료.
3. `/sales`에서 오늘 매출 증가 확인.
4. 직원 보드에서 결제 완료 주문 환불.
5. `/sales`에서 환불 금액/건수/목록 반영 확인.
6. `/manager`에서 오늘 순매출 또는 환불 상태 확인.

완료 기준:

- 총 매출은 `PAID` 결제 합계다.
- 환불 금액은 `REFUNDED` 결제 합계다.
- 순매출은 `총 매출 - 환불 금액`으로 보인다.
- 어제 결제분이 오늘 환불되어 순매출이 음수이면 음수 부호와 경고 색상으로 보인다.
- 결제수단별 매출은 환불된 결제를 포함하지 않는다.
- 결제수단별 항목은 카드/현금/기타 3개가 항상 보인다.
- 최근 결제/환불 목록이 각각 최신순이다.
- 최근 결제/환불 목록은 각각 최근 50건 제한이 화면에 명시된다.

## 회귀 테스트 체크리스트

- 주문 생성/취소 흐름 정상.
- 직원 주문 보드 결제 완료 정상.
- 환불 처리 정상.
- 매니저 대시보드 로딩 정상.
- `/sales` 접근 권한은 `ROLE_ADMIN`, `ROLE_MANAGER`만 허용.
- 키오스크/주방 화면 영향 없음.

## 후속 개선

- 최근 결제/환불 목록 페이징 또는 더보기.
- 일별 매출 추이 차트.
- 결제수단별 비중 차트.
- CSV/엑셀 다운로드.
- 기간별 주문 수량/객단가.
- 메뉴별 매출 순위.
- 영업 마감 스냅샷.
- PG 정산 대조.
