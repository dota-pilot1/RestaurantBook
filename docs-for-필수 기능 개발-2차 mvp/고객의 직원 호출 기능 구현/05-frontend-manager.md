# 05. 프론트엔드 - 매니저 대시보드

작성일: 2026-05-08

## 목표

매니저 대시보드(`/manager`)에 미처리 직원 호출 메트릭을 추가한다. 매니저는 **응대 주체가 아니므로** 카운트 모니터링 + 빠른 이동만 제공한다.

> 매니저가 직접 응대를 원할 때는 `staff-calls:operations` 토픽 구독 권한이 있으므로 직원 보드에 접근해 응대 가능.

## 영향 파일

- `restaurant-book-front/src/entities/manager/model/types.ts` (필드 추가)
- `restaurant-book-front/src/app/manager/page.tsx` (UI 추가)

## 1. 타입 확장

파일: `restaurant-book-front/src/entities/manager/model/types.ts`

```ts
export type ManagerDashboard = {
  todayOrderCount: number;
  receivedCount: number;
  acceptedCount: number;
  cookingCount: number;
  readyCount: number;
  canceledTodayCount: number;
  pendingStaffCallCount: number; // 추가
};
```

## 2. 매니저 페이지

파일: `restaurant-book-front/src/app/manager/page.tsx`

### 2.1 import 추가

```tsx
import { PhoneCall } from "lucide-react";
import { useOperationsStaffCallsWebSocket } from "@/entities/staff-call/api/staffCallRealtime";
```

### 2.2 WebSocket 구독

기존 `useOperationalOrdersWebSocket()` 옆에 추가.

```tsx
useOperationalOrdersWebSocket();
useOperationsStaffCallsWebSocket();
```

`staffCallRealtime`의 훅이 `manager-dashboard` 쿼리도 invalidate 하도록 이미 정의되어 있으므로 별도 콜백 없이 카운트가 갱신된다.

### 2.3 메트릭 카드 / 흐름 카드 추가

`flowStages` 옵션 카드는 4개 → 5개로 늘리거나, 별도 영역에 분리.
하단 quick link 영역에 `직원 호출` 메트릭 카드를 추가하는 안이 시각적으로 깔끔하다.

선택안 A: 기존 `MetricCard` 4개 라인에 호출 카드 추가

```tsx
<section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
  <MetricCard
    label="오늘 주문"
    value={`${dashboard?.todayOrderCount ?? 0}건`}
    delta={`진행 ${inProgress}건`}
    icon={ShoppingBag}
  />
  ...

  <MetricCard
    label="직원 호출"
    value={`${dashboard?.pendingStaffCallCount ?? 0}건`}
    delta={
      (dashboard?.pendingStaffCallCount ?? 0) > 0 ? "응대 대기" : "없음"
    }
    icon={PhoneCall}
    href="/staff"
    tone={(dashboard?.pendingStaffCallCount ?? 0) > 0 ? "alert" : undefined}
  />
</section>
```

`MetricCard`에 `tone` prop을 추가하여 빨간 배경/배지 효과로 강조한다.

```tsx
function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  href,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  tone?: "alert";
}) {
  const containerClass =
    tone === "alert"
      ? "rounded-lg border border-rose-300 bg-rose-50 p-4 transition-colors hover:bg-rose-100"
      : "rounded-lg border border-border bg-background p-4 transition-colors hover:bg-accent";
  ...
}
```

선택안 B: `flowStages`에 5번째 stage 추가

```tsx
const flowStages = [
  { label: "접수", value: receivedAndAccepted, tone: "bg-blue-500" },
  { label: "조리 중", value: dashboard?.cookingCount ?? 0, tone: "bg-amber-500" },
  { label: "조리 완료", value: readyCount, tone: "bg-emerald-500" },
  { label: "취소", value: dashboard?.canceledTodayCount ?? 0, tone: "bg-red-500" },
  { label: "직원 호출", value: dashboard?.pendingStaffCallCount ?? 0, tone: "bg-rose-500" },
];
```

이 경우 grid를 `sm:grid-cols-5`로 늘려야 하므로 가로 폭 재검토 필요.

**권장: 선택안 A** (메트릭 카드 4 → 4(주문/매출/대기/완료) 그대로 두고, 새 행으로 호출 메트릭 그룹을 따로 추가하거나 `결제 완료` 카드를 호출 카드로 교체).

가장 단순한 변형: 기존 `결제 완료` 카드를 그대로 두고 `MetricCard` 1줄 5개로 늘리거나, 매트릭 카드를 4개 유지하고 흐름 카드 옆에 호출 미니 카드를 둔다.

```tsx
<section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
  <div className="rounded-lg border border-border bg-background">
    {/* 실시간 주문 흐름 (기존) */}
  </div>

  <div className="space-y-4">
    <div
      className={cn(
        "rounded-lg border p-4",
        (dashboard?.pendingStaffCallCount ?? 0) > 0
          ? "border-rose-300 bg-rose-50"
          : "border-border bg-background",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PhoneCall className="h-4 w-4" />
          <h2 className="text-sm font-semibold">직원 호출</h2>
        </div>
        <Link href="/staff" className="text-xs font-bold text-muted-foreground hover:text-foreground">
          응대 보드
        </Link>
      </div>
      <p className="mt-3 text-3xl font-bold">{dashboard?.pendingStaffCallCount ?? 0}건</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {(dashboard?.pendingStaffCallCount ?? 0) > 0
          ? "직원 보드에서 호출 처리"
          : "현재 미처리 호출 없음"}
      </p>
    </div>

    <div className="rounded-lg border border-border bg-background">
      {/* 오늘 결제수단 (기존) */}
    </div>
  </div>
</section>
```

`cn`을 사용하려면 `@/shared/lib/utils`에서 import. 이 페이지가 아직 안 쓰면 추가.

## 3. 알림 토스트 (선택)

매니저 대시보드도 새 호출 토스트가 필요하면 콜백을 사용.

```tsx
useOperationsStaffCallsWebSocket(true, (payload) => {
  if (payload.reason === "CREATED") {
    toast.info(`${payload.tableName ?? ""} 직원 호출 발생`);
  }
});
```

매니저는 화면을 항상 보고 있지 않을 수 있으므로 토스트만 띄우고 사운드는 직원 보드에서만 재생하도록 한다 (스코프 분리).

## 4. 라우팅/메뉴 변경

`navigationMenus` 시드에 `직원 호출 보드` 같은 별도 화면을 추가하지 않는다. 이번 MVP에서는 직원 보드 안의 `호출(N)` 버튼이 진입점이다.

## 완료 기준

- `/manager` 페이지에 미처리 호출 카운트 카드가 보인다.
- 호출이 1건 이상이면 카드가 빨간 배경으로 강조된다.
- 직원이 호출을 acknowledge하면 카운트가 즉시 줄어든다 (WebSocket → invalidate `manager-dashboard`).
- 카드 클릭 시 `/staff` 직원 보드로 이동한다.
