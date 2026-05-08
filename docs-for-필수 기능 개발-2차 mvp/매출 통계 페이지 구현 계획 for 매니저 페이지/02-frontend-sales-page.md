# 02. 프론트엔드 `/sales` 페이지 구현 계획

## 방향

`/sales` UI는 현재 구조를 유지할 필요가 없다. 매니저가 운영 중 빠르게 스캔할 수 있는 통계 화면으로 재구성한다.

작업 대상:

- `restaurant-book-front/src/app/sales/page.tsx`
- `restaurant-book-front/src/entities/payment/model/types.ts`
- `restaurant-book-front/src/entities/payment/api/paymentApi.ts`

## 1. 타입/API

파일: `restaurant-book-front/src/entities/payment/model/types.ts`

현재 필요한 필드는 이미 있다.

- `PaymentMethod`
- `PaymentStatus`
- `PaymentMethodSummary`
- `PaymentListItem`
- `SalesSummary`
- `SalesResponse`

계획:

- 백엔드 응답과 타입 이름을 유지한다.
- `netAmount` 타입 추가는 하지 않는다.
- 화면 내부에서 `const netAmount = totalAmount - refundAmount`로 계산한다.
- `PaymentListItem.refundedAt` 타입은 기존 호환 때문에 `string | null`을 유지할 수 있지만, 환불 목록 렌더링에서는 null fallback을 사용하지 않는다.

파일: `restaurant-book-front/src/entities/payment/api/paymentApi.ts`

계획:

- 현재 `getTodaySalesSummary()`, `getSales()` 유지.
- API 추가 없음.
- 쿼리 파라미터는 `startDate`, `endDate`만 사용한다.

## 2. 페이지 상태

파일: `restaurant-book-front/src/app/sales/page.tsx`

현재 상태:

- `preset`
- `startDate`
- `endDate`
- React Query `["sales", startDate, endDate]`

계획:

- 현재 상태 구조 유지.
- `CUSTOM` 선택 후 날짜를 직접 수정하면 preset이 `CUSTOM`으로 바뀌게 한다.
- 시작일이 종료일보다 뒤가 되지 않도록 UI에서 보정한다.
- `refetchOnWindowFocus`는 유지한다.

권장 헬퍼:

- `formatPrice(value)`
- `formatDateTime(value)`
- `formatPercent(value)`
- `getPresetRange(preset)`
- `getShortOrderNo(orderNo)`
- `getNetAmount(data)`
- `getMethodPercent(summary.amount, data.totalAmount)`

## 3. 헤더 영역

현재:

- `매출 관리`
- 설명 문구
- 새로고침 버튼

수정 계획:

- 제목을 `매출 통계`로 변경한다.
- 설명은 `결제 완료와 환불 기록을 기준으로 기간별 매출을 확인합니다.` 정도로 단순화한다.
- 새로고침 버튼은 유지한다.
- 상단 아이콘은 `BarChart3` 유지.

## 4. 기간 필터

현재:

- 오늘
- 최근 7일
- 이번 달
- 직접 선택
- 시작일/종료일 date input

수정 계획:

- 기존 프리셋 유지.
- 필터 섹션은 더 조밀하게 배치한다.
- 직접 선택 버튼을 눌렀을 때만 날짜 입력이 강조되게 한다.
- 날짜 입력 변경 시 `preset`을 `CUSTOM`으로 바꾼다.

완료 기준:

- 오늘 선택 시 시작일/종료일이 오늘로 바뀐다.
- 최근 7일 선택 시 오늘 포함 7일이다.
- 이번 달 선택 시 이번 달 1일부터 오늘까지다.
- 직접 날짜 수정 후 조회가 자동으로 갱신된다.

## 5. 핵심 지표 카드

현재:

- 총 매출
- 결제 건수
- 환불 금액
- 환불 건수

수정 계획:

카드 4개를 다음처럼 바꾼다.

1. 총 매출
   - `data.totalAmount`
   - 결제 완료 기준
2. 순매출
   - `data.totalAmount - data.refundAmount`
   - 환불 반영
3. 결제 건수
   - `data.paymentCount`
   - 환불 건수와 함께 보조 표시 가능
4. 환불
   - `data.refundAmount`
   - `data.refundCount` 보조 표시

주의:

- 순매출은 실제 운영에서 음수가 될 수 있다. 어제 결제분이 오늘 환불되면 오늘 총 매출보다 환불 금액이 클 수 있다.
- 순매출이 음수이면 `-12,000원`처럼 음수 부호를 유지하고, 값 색상은 red 계열로 표시한다.
- 0원 이상이면 일반 금액 색상을 사용한다.
- 금액은 `tabular-nums`를 유지해 숫자 폭을 안정화한다.
- 카드 내부 텍스트가 모바일에서 넘치지 않게 제목과 값 크기를 조정한다.

## 6. 결제수단별 매출

현재:

- 카드/현금/기타 금액과 건수 목록

수정 계획:

- 카드/현금/기타 3개는 항상 표시한다.
- 3개 항목 보장은 백엔드 `SalesService`가 담당한다.
- 프론트는 누락 메서드를 기본 보강하지 않는다. 단, API 계약이 깨졌을 때 화면이 죽지 않도록 방어적으로 빈 배열 처리는 유지한다.
- 금액, 건수, 전체 대비 비중을 표시한다.
- 비중은 단순 막대 또는 얇은 progress bar로 표현한다.
- `totalAmount === 0`이면 비중은 0%로 처리한다.

완료 기준:

- 결제 기록이 없어도 카드/현금/기타 항목이 안정적으로 보인다.
- 결제수단별 총액 합이 총 매출과 일치한다.
- 합계 일치 검증은 백엔드 테스트에서 우선 확인하고, 프론트는 표시만 담당한다.

## 7. 최근 결제 목록

현재:

- 결제시각, 주문번호, 테이블, 결제수단, 금액

수정 계획:

- 기존 컬럼 유지.
- 섹션 제목 또는 보조 문구에 `최근 50건`을 명시한다.
- 모바일에서는 `min-w` 테이블 + horizontal scroll 유지.
- 주문번호는 짧은 번호를 보여주되 title이나 보조 텍스트로 원본을 확인할 수 있게 할 수 있다.
- 결제수단은 텍스트만 두어도 충분하다.

완료 기준:

- 빈 상태 문구가 보인다.
- 결제 목록이 최신순이다.
- 결제 건수가 50건을 넘어도 목록은 최근 50건만 보인다는 점이 화면에 드러난다.

## 8. 최근 환불 목록

현재:

- 환불시각, 주문번호, 테이블, 결제수단, 환불 금액

수정 계획:

- 기존 컬럼 유지.
- 섹션 제목 또는 보조 문구에 `최근 50건`을 명시한다.
- 환불 금액은 음수 표시 또는 `환불` 배지로 명확히 구분한다.
- `refundedAt`을 필수 데이터로 보고 렌더링한다. `refundedAt`이 없으면 `-`를 표시하거나 오류 상태로 드러내며, `paidAt`으로 대체하지 않는다.
- 환불 목록은 결제 목록과 같은 폭/타이포그래피를 사용한다.

완료 기준:

- 빈 상태 문구가 보인다.
- 환불 목록이 최신순이다.
- 환불 금액/건수가 상단 카드와 일치한다.
- 환불시각이 없는 환불 데이터는 결제시각으로 둔갑하지 않는다.

## 9. 컴포넌트 분리 선택지

MVP에서는 한 파일 유지 가능하다.

파일이 커지면 아래처럼 분리한다.

```
restaurant-book-front/src/features/sales-statistics/
├── SalesDateFilter.tsx
├── SalesMetricGrid.tsx
├── SalesMethodSummary.tsx
├── PaymentTable.tsx
└── salesFormatters.ts
```

권장:

- 첫 구현은 `app/sales/page.tsx` 안에서 정리한다.
- UI가 안정되면 `features/sales-statistics`로 분리한다.

## 10. 브라우저 검증

검증 경로:

- `/sales`
- `/manager` -> `매출 상세` 또는 `매출 통계` 링크

검증 항목:

- 데스크톱 폭에서 카드/테이블이 겹치지 않는다.
- 모바일 폭에서 테이블은 가로 스크롤로 유지된다.
- 날짜 필터 변경 시 API가 재조회된다.
- 데이터 없음 상태가 깨지지 않는다.
- 환불 데이터가 있을 때 상단 카드와 환불 목록이 일치한다.
- 결제/환불 목록 제목에 최근 50건 제한이 표시된다.
- 순매출이 음수일 때 음수 부호와 경고 색상이 유지된다.
