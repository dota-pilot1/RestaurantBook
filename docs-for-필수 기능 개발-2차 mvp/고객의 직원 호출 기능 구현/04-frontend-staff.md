# 04. 프론트엔드 - 직원 페이지

작성일: 2026-05-08

## 목표

직원 주문 보드 우측 상단에 `취소(N)` 버튼과 같은 패턴으로 `호출(N)` 버튼을 추가한다.
클릭 시 다이얼로그가 열리고 테이블별 호출 카드를 보고 "확인" 버튼으로 처리한다.

## 영향 파일

- `restaurant-book-front/src/features/staff-ready-orders/StaffReadyOrders.tsx` (수정)
- `restaurant-book-front/src/entities/staff-call/api/staffCallApi.ts` (03-frontend-customer.md에서 이미 생성)
- `restaurant-book-front/src/entities/staff-call/api/staffCallRealtime.ts` (03에서 이미 생성)

## 1. import 추가

```tsx
import { Phone, PhoneCall } from "lucide-react";
import { staffCallApi } from "@/entities/staff-call/api/staffCallApi";
import { useOperationsStaffCallsWebSocket } from "@/entities/staff-call/api/staffCallRealtime";
import type { StaffCall, StaffCallType } from "@/entities/staff-call/model/types";
```

## 2. 라벨 상수

파일 상단의 `statusLabel` 등 옆에 추가.

```tsx
const staffCallTypeLabel: Record<StaffCallType, string> = {
  GENERAL: "일반 호출",
  REFILL: "물·반찬 리필",
  QUESTION: "메뉴 문의",
  PAYMENT: "결제 도움",
  OTHER: "기타",
};
```

## 3. 사운드 알림 (선택)

새 호출 발생 시 가벼운 "딩동" 톤 재생. KioskHome의 `playCancelAlertSound`와 동일 패턴.

```tsx
const playStaffCallAlert = () => {
  if (typeof window === "undefined") return;
  const W = window as Window & {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctx = W.AudioContext || W.webkitAudioContext;
  if (!Ctx) return;
  try {
    const ac = new Ctx();
    const tone = (start: number, freq: number) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(start);
      osc.stop(start + 0.32);
    };
    const t = ac.currentTime;
    tone(t, 880);
    tone(t + 0.18, 1175);
    window.setTimeout(() => void ac.close(), 900);
  } catch {
    // ignore
  }
};
```

## 4. StaffOrderBoardContent 변경

### 4.1 상태 추가

```tsx
const [staffCallDialogOpen, setStaffCallDialogOpen] = useState(false);
```

### 4.2 데이터 조회 + WebSocket

`useOperationalOrdersWebSocket()` 호출 직후에 추가.

```tsx
const {
  data: staffCalls = [],
} = useQuery({
  queryKey: ["operations-staff-calls"],
  queryFn: staffCallApi.getPendingOperationsCalls,
  refetchInterval: 15000,
  refetchOnWindowFocus: true,
});

useOperationsStaffCallsWebSocket(true, (payload) => {
  if (payload.reason === "CREATED") {
    playStaffCallAlert();
    toast.info(
      `${payload.tableName ? payload.tableName + " · " : ""}직원 호출이 들어왔습니다.`,
    );
  }
});
```

### 4.3 acknowledge 뮤테이션

```tsx
const acknowledgeStaffCallMutation = useMutation({
  mutationFn: (callId: number) => staffCallApi.acknowledgeOperationsCall(callId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["operations-staff-calls"] });
    toast.success("호출을 확인 처리했습니다.");
  },
  onError: (error) => toastError(error, "호출 확인 처리를 하지 못했습니다."),
});
```

### 4.4 헤더 버튼 추가

`visibleCanceledOrders` 버튼 옆에 호출 버튼을 둔다 (현재 `StaffReadyOrders.tsx:262-271`).

```tsx
<div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
  {visibleCanceledOrders.length > 0 ? (
    <button
      type="button"
      onClick={() => setCancelNoticeDialogOpen(true)}
      className="..."
    >
      <Bell className="h-4 w-4" />
      취소({visibleCanceledOrders.length})
    </button>
  ) : null}

  {staffCalls.length > 0 ? (
    <button
      type="button"
      onClick={() => setStaffCallDialogOpen(true)}
      className="inline-flex min-h-[4.25rem] items-center justify-center gap-2 rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800 transition-colors hover:bg-rose-100 animate-pulse"
    >
      <PhoneCall className="h-4 w-4" />
      호출({staffCalls.length})
    </button>
  ) : null}

  <SummaryTile label="진행 중" value={`${counts.ACCEPTED + counts.COOKING}건`} />
  ...
</div>
```

`animate-pulse`는 있는 동안만 적용된다. 호출이 0건이 되면 자동 사라진다.

> Tailwind 표준 클래스이므로 추가 설정 불필요. 강조가 너무 강하면 빼도 된다.

### 4.5 호출 다이얼로그

`NoticeDialog`로 감싼다 (취소 안내 다이얼로그 패턴, `StaffReadyOrders.tsx:341-387` 참고).

```tsx
<NoticeDialog
  open={staffCallDialogOpen}
  title="직원 호출"
  tone="info"
  confirmText="닫기"
  onConfirm={() => setStaffCallDialogOpen(false)}
>
  <div className="space-y-3">
    <p className="text-sm font-semibold text-foreground">
      테이블별 호출을 확인 처리하면 고객 화면에 알림이 갱신됩니다.
    </p>
    <div className="max-h-72 space-y-2 overflow-y-auto">
      {staffCalls.length === 0 ? (
        <p className="text-sm text-muted-foreground">대기 중인 호출이 없습니다.</p>
      ) : null}
      {staffCalls.map((call) => (
        <StaffCallRow
          key={call.id}
          call={call}
          onAcknowledge={() => acknowledgeStaffCallMutation.mutate(call.id)}
          processing={
            acknowledgeStaffCallMutation.isPending &&
            acknowledgeStaffCallMutation.variables === call.id
          }
        />
      ))}
    </div>
  </div>
</NoticeDialog>
```

### 4.6 StaffCallRow

같은 파일 하단에 함수 컴포넌트로 추가.

```tsx
function StaffCallRow({
  call,
  onAcknowledge,
  processing,
}: {
  call: StaffCall;
  onAcknowledge: () => void;
  processing: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(id);
  }, []);
  const elapsedSec = Math.max(0, Math.floor((now - new Date(call.createdAt).getTime()) / 1000));
  const elapsedLabel =
    elapsedSec < 60 ? `${elapsedSec}초 전` : `${Math.floor(elapsedSec / 60)}분 전`;

  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-rose-800">
            {call.tableName} · {staffCallTypeLabel[call.type]}
          </p>
          <p className="mt-1 text-xs font-semibold text-rose-700">
            {elapsedLabel} · {formatTime(call.createdAt)}
          </p>
        </div>
        <button
          type="button"
          disabled={processing}
          onClick={onAcknowledge}
          className="shrink-0 rounded-md bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? "처리 중" : "확인"}
        </button>
      </div>
      {call.message ? (
        <p className="mt-2 text-sm font-semibold text-rose-800">{call.message}</p>
      ) : null}
    </div>
  );
}
```

`formatTime`은 파일 상단에 이미 있다.

### 4.7 staffCallTypeLabel 위치 정리

`statusLabel` 상수가 있는 위치 근처에 `staffCallTypeLabel`을 두면 일관됨.

## 5. 키친 보드 처리

키친 페이지(`/kitchen-board`)는 `kitchen-order-board` feature이며, 호출 응대 책임이 없으므로 변경하지 않는다.
백엔드에서도 `ROLE_KITCHEN`은 `staff-calls:operations` 토픽 구독을 거부한다.

## 6. 운영 정책 메모

- 직원이 호출 확인 처리를 했지만 실제 응대 전이라면 별도 메모 입력 기능은 MVP 스코프 외.
- `acknowledged_at`/`acknowledged_by`는 백엔드에 기록되므로 후속 운영 분석에서 활용 가능.
- 호출 다이얼로그 자체에서 처리하지 않고 카드를 카드뷰로 보드 영역에 띄우는 안도 가능하지만, 화면 너비가 제한적이라 다이얼로그 패턴을 채택.

## 완료 기준

- 호출이 1건 이상이면 헤더에 `호출(N)` 버튼이 나타나고 깜빡인다.
- 클릭하면 호출 목록 다이얼로그가 열린다.
- "확인" 버튼 클릭 → 즉시 목록에서 사라지고 토스트가 뜨며 고객 화면 패널도 사라진다.
- 새 호출이 도착하면 사운드 알림 + 토스트가 뜬다.
- 30초마다 표시되는 경과 시간이 갱신된다 (5초 인터벌).
