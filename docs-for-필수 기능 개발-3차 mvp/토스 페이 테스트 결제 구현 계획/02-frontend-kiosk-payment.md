# 02. 프론트 고객 키오스크 결제 구현

## 추가 파일

### `restaurant-book-front/src/entities/payment/api/customerPaymentApi.ts`

역할:

- 고객 결제 설정 조회와 결제 승인 API 호출을 담당한다.

함수:

```ts
getTossPaymentConfig(): Promise<TossPaymentConfig>
confirmTossPayment(body: ConfirmTossPaymentBody): Promise<ConfirmTossPaymentResponse>
```

### `restaurant-book-front/src/entities/payment/model/customerPaymentTypes.ts`

타입:

```ts
export type TossPaymentConfig = {
  clientKey: string;
};

export type ConfirmTossPaymentBody = {
  restaurantOrderId: number;
  tossOrderId: string;
  paymentKey: string;
  amount: number;
};

export type ConfirmTossPaymentResponse = {
  order: Order;
};
```

### `restaurant-book-front/src/shared/lib/tossPayments.ts`

역할:

- 토스페이먼츠 v2 SDK 스크립트를 동적으로 로드한다.
- `window.TossPayments` 타입을 좁혀서 키오스크에서 사용한다.

SDK URL:

```text
https://js.tosspayments.com/v2/standard
```

사용할 방식:

- 시범 케이스는 결제창형 연동을 우선 사용한다.
- 별도 결제수단 UI를 화면에 붙이지 않고 `결제` 버튼 클릭 시 결제창을 연다.

호출 예시:

```ts
const tossPayments = await loadTossPayments(clientKey);
const payment = tossPayments.payment({ customerKey: "ANONYMOUS" });

await payment.requestPayment({
  method: "CARD",
  amount: { value: order.totalAmount, currency: "KRW" },
  orderId: tossOrderId,
  orderName,
  successUrl,
  failUrl,
});
```

## 추가 페이지

### `restaurant-book-front/src/app/customer/payment/success/page.tsx`

역할:

- 토스 결제 성공 리다이렉트를 처리한다.
- query string의 `paymentKey`, `orderId`, `amount`, `restaurantOrderId`를 읽는다.
- 백엔드 `confirmTossPayment()` 호출 후 성공/실패 안내를 보여준다.
- 성공 시 고객 주문 목록 캐시가 갱신될 수 있도록 `/customer`로 돌아가는 버튼을 제공한다.

주의:

- 이 페이지에서 주문 완료 처리를 직접 하지 않는다.
- 서버 승인 API 성공 후에만 완료 안내를 보여준다.

### `restaurant-book-front/src/app/customer/payment/fail/page.tsx`

역할:

- 토스 결제 실패/취소 리다이렉트를 처리한다.
- query string의 `code`, `message`, `orderId`를 보여준다.
- `/customer`로 돌아가는 버튼을 제공한다.

## 수정 파일

### `restaurant-book-front/src/features/kiosk/KioskHome.tsx`

추가 import:

- `CreditCard` 아이콘
- `customerPaymentApi`
- `loadTossPayments`

추가 상태:

- `payingOrderId`
- 결제 설정 query

결제 가능 주문 계산:

```ts
const payableOrders = acceptedOrders.filter((order) => order.status === "READY");
const payableTotalPrice = payableOrders.reduce((sum, order) => sum + order.totalAmount, 0);
```

버튼 위치:

- 현재 하단 `grid grid-cols-[1fr_44px]` 구조를 `grid grid-cols-[1fr_1fr_44px]`로 변경한다.
- 순서: `결제`, `직원 호출`, `설정`

버튼 노출/비활성화:

- `payableOrders.length === 0`이면 비활성화
- 토스 클라이언트 키가 없으면 비활성화하고 토스트로 설정 필요 안내
- 장바구니에 추가 주문이 남아 있으면 먼저 주문 접수하도록 안내

결제 대상:

- 1차 구현은 `READY` 주문이 1건일 때 바로 결제
- `READY` 주문이 여러 건이면 합산 결제는 보류한다. 먼저 주문별 결제 선택 모달을 띄우거나 가장 오래된 READY 주문만 결제한다.
- 추천: 시범 케이스에서는 가장 오래된 READY 주문 1건 결제만 허용하고, 여러 건이면 직원 호출 또는 주문별 선택 모달 후속 구현으로 분리한다.

토스 orderId:

```ts
const tossOrderId = `rb-${order.id}-${Date.now()}`;
```

successUrl:

```ts
`${window.location.origin}/customer/payment/success?restaurantOrderId=${order.id}`
```

failUrl:

```ts
`${window.location.origin}/customer/payment/fail?restaurantOrderId=${order.id}`
```

## UI 문구

결제 버튼:

- 기본: `결제`
- 진행 중: `결제창 여는 중`
- 비활성: `결제 대기 없음`

후불 결제 안내 박스:

- READY 주문이 없을 때 기존 문구 유지
- READY 주문이 있을 때: `조리 완료된 주문은 결제 버튼으로 테스트 결제할 수 있습니다.`

## 모바일/키오스크 UX

- 버튼 높이는 기존 `h-11` 유지
- `CreditCard` 아이콘 사용
- 하단 버튼 3개가 좁아지므로 텍스트 줄바꿈이 생기지 않게 `text-xs sm:text-sm` 또는 버튼 간격 조정
- 결제 진행 중 중복 클릭 방지

