# 03. 프론트엔드 환불 UI

## 목표

직원 주문 보드에서 결제 완료 주문을 환불 처리하고, 매출 화면에서 환불 집계를 실제 API 데이터로 표시한다.

## 1. 타입 확장

파일: `restaurant-book-front/src/entities/payment/model/types.ts`

```ts
export type PaymentListItem = {
  id: number;
  orderId: number;
  orderNo: string;
  tableName: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string;
  refundedAt: string | null;
  handledBy: number | null;
  refundedBy: number | null;
};

export type SalesResponse = SalesSummary & {
  startDate: string;
  endDate: string;
  refundAmount: number;
  refundCount: number;
  recentPayments: PaymentListItem[];
  refundedPayments: PaymentListItem[];
};
```

`SalesSummary`에도 환불 필드를 추가하기로 했다면 동일하게 `refundAmount/refundCount`를 포함한다.

## 2. 주문 API 추가

파일: `restaurant-book-front/src/entities/order/api/orderApi.ts`

```ts
refundOperationOrder: (orderId: number) =>
  api.patch<Order>(`/api/operations/orders/${orderId}/refund`).then((r) => r.data),
```

## 3. 직원 주문 보드

파일: `restaurant-book-front/src/features/staff-ready-orders/StaffReadyOrders.tsx`

`COMPLETED` 카드에만 환불 버튼을 노출한다. 현재 파일은 `StaffReadyOrders` 이름이지만 실제로는 직원 주문 보드 전체를 담당한다.

권장 UX:

- 결제 완료 카드에 `환불` 버튼 추가
- 확인 다이얼로그 또는 기존 `ConfirmDialog` 사용
- 성공 시 `operation-orders`, `sales` 쿼리 무효화
- 실패 시 기존 `toastError` 사용

구현 예시:

```tsx
const refundMutation = useMutation({
  mutationFn: orderApi.refundOperationOrder,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["operation-orders"] });
    queryClient.invalidateQueries({ queryKey: ["sales"] });
    toast.success("환불 처리했습니다.");
  },
  onError: (error) => toastError(error, "환불 처리하지 못했습니다."),
});
```

버튼은 결제 완료 상태에서만 표시한다.

```tsx
{order.status === "COMPLETED" ? (
  <button
    type="button"
    onClick={() => refundMutation.mutate(order.id)}
    disabled={refundMutation.isPending}
  >
    환불
  </button>
) : null}
```

실제 적용 시에는 현재 보드의 버튼 스타일, 아이콘 사용 방식, 다이얼로그 패턴을 따른다.

## 4. 매출 화면

파일: `restaurant-book-front/src/app/sales/page.tsx`

현재 placeholder인 `취소 금액`, `환불 금액` 카드를 실제 값으로 바꾼다.

권장 표시:

- `총 매출`: `data.totalAmount`
- `결제 건수`: `data.paymentCount`
- `환불 금액`: `data.refundAmount`
- `환불 건수`: `data.refundCount`

환불 목록은 최근 결제 목록 아래 또는 옆에 별도 테이블로 둔다.

```tsx
<Metric title="환불 금액" value={isLoading ? "-" : formatPrice(data?.refundAmount ?? 0)} icon={RotateCcw} />
<Metric title="환불 건수" value={isLoading ? "-" : `${data?.refundCount ?? 0}건`} icon={ReceiptText} />
```

환불 목록의 시간은 `refundedAt`을 우선 사용한다.

```tsx
formatDateTime(payment.refundedAt ?? payment.paidAt)
```

## 완료 기준

- 결제 완료 주문에만 환불 액션이 보인다.
- 환불 성공 후 직원 보드에서 해당 주문이 사라지거나 취소 상태로 갱신된다.
- 매출 화면의 환불 금액/건수가 API 응답과 일치한다.
- 환불 목록에서 주문번호, 테이블, 결제수단, 금액, 환불시각을 확인할 수 있다.

