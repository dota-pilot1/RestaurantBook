# 03. 매니저 대시보드 연결 계획

## 목표

`/manager`는 매출 통계의 진입점 역할을 한다. 상세 집계는 `/sales`에서 보고, 매니저 대시보드는 오늘 운영 상태를 빠르게 보여준다.

작업 대상:

- `restaurant-book-front/src/app/manager/page.tsx`
- `restaurant-book-front/src/entities/payment/model/types.ts`
- `restaurant-book-front/src/entities/payment/api/paymentApi.ts`

## 1. 오늘 매출 카드

현재:

- `오늘 매출`
- `todaySales.totalAmount`
- 결제 건수 표시
- `/sales` 링크

계획:

- 현재 카드 유지.
- 보조 문구를 `결제 N건`처럼 명확히 한다.
- 클릭 시 `/sales`로 이동한다.

## 2. 오늘 순매출 또는 환불 카드

현재:

- `결제 완료` 카드가 결제 건수를 보여준다.

수정 선택지:

### 선택안 A: 결제 완료 카드 유지

- 가장 작은 변경.
- 주문 흐름과 결제 건수를 계속 드러낼 수 있다.
- 환불이 중요한 날에는 매출 상태를 한눈에 보기 어렵다.

### 선택안 B: 환불 카드로 교체

- `환불`
- 값: `todaySales.refundAmount`
- 보조: `${todaySales.refundCount}건`
- `/sales` 링크

### 선택안 C: 순매출 카드로 교체

- `오늘 순매출`
- 값: `todaySales.totalAmount - todaySales.refundAmount`
- 보조: `환불 ${refundCount}건`
- `/sales` 링크

권장: **선택안 C**

이유:

- 매니저는 결제 총액보다 실제 남은 매출을 더 자주 확인한다.
- 결제 건수는 오늘 매출 카드 보조 문구로 남길 수 있다.
- 환불 금액이 커질 때 운영상 이상 징후를 빠르게 볼 수 있다.

## 3. 오늘 결제수단 영역

현재:

- 카드/현금/기타 금액과 건수 표시
- 상세 보기 링크

계획:

- 현재 영역 유지.
- 전체 대비 비중을 추가할 수 있다.
- 데이터가 없을 때 빈 상태 문구를 추가한다.

## 4. 빠른 이동 버튼

현재:

- 상단 `매출 상세`
- 결제수단 카드의 `상세 보기`

계획:

- 라벨을 `/sales` 화면명과 맞춘다.
- `/sales` 제목을 `매출 통계`로 바꾸면 링크 라벨도 `매출 통계`로 맞춘다.

## 5. 데이터 갱신

현재:

- `useOperationalOrdersWebSocket()`
- `useOperationsStaffCallsWebSocket()`
- `getTodaySalesSummary()` 쿼리

계획:

- WebSocket 이벤트가 결제/환불 후 매니저 화면까지 충분히 갱신되는지 확인한다.
- 결제/환불 mutation 성공 지점에서 React Query 캐시를 invalidate한다.
- 주문 변경 WebSocket 이벤트를 받는 화면에서는 `["sales", "today-summary"]` 쿼리도 함께 invalidate할 수 있는지 검토한다.

MVP 권장:

- 1순위: 결제/환불 mutation 성공 시 `queryClient.invalidateQueries({ queryKey: ["sales"] })`로 오늘 요약과 매출 상세를 갱신한다.
- 2순위: 다른 브라우저/탭의 `/manager` 반영이 늦으면 주문 변경 WebSocket 수신 시 sales 쿼리 invalidate를 추가한다.
- 3순위: 그래도 누락이 있으면 `refetchInterval: 10_000` 정도의 낮은 비용 fallback을 검토한다.

## 완료 기준

- `/manager`에서 오늘 매출과 순매출/환불 상태를 확인할 수 있다.
- `/sales`로 이동하는 진입점이 명확하다.
- 같은 브라우저에서 결제/환불 처리 직후 오늘 매출 요약이 즉시 갱신된다.
- 매니저 대시보드의 기존 주문/직원호출/주방 흐름 카드가 깨지지 않는다.
