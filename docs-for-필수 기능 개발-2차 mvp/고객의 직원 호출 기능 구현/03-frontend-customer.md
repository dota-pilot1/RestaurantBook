# 03. 프론트엔드 - 고객(키오스크) 페이지

작성일: 2026-05-08

## 목표

KioskHome 우측 하단 placeholder `[직원 호출]` 버튼을 활성화한다.

흐름:
1. 버튼 클릭 → 다이얼로그 열림
2. 호출 유형 빠른 선택 + 메시지 입력 (선택)
3. "호출하기" 클릭 → API 호출
4. 호출 중 상태 패널이 사이드바에 표시 (경과 시간, 취소 버튼)
5. 직원이 처리하면 WebSocket으로 받아 토스트 + 패널 제거

## 1. 타입 정의

신규 파일: `restaurant-book-front/src/entities/staff-call/model/types.ts`

```ts
export type StaffCallStatus = "PENDING" | "ACKNOWLEDGED" | "CANCELED";

export type StaffCallType = "GENERAL" | "REFILL" | "QUESTION" | "PAYMENT" | "OTHER";

export type CreateStaffCallBody = {
  tableName: string;
  type?: StaffCallType;
  message?: string | null;
};

export type CancelStaffCallBody = {
  tableName: string;
};

export type StaffCall = {
  id: number;
  tableName: string;
  type: StaffCallType;
  message: string | null;
  status: StaffCallStatus;
  acknowledgedAt: string | null;
  acknowledgedBy: number | null;
  createdAt: string;
  updatedAt: string;
};
```

## 2. API 클라이언트

신규 파일: `restaurant-book-front/src/entities/staff-call/api/staffCallApi.ts`

```ts
import { api } from "@/shared/api/axios";
import type {
  CancelStaffCallBody,
  CreateStaffCallBody,
  StaffCall,
} from "../model/types";

export const staffCallApi = {
  createCustomerCall: (body: CreateStaffCallBody) =>
    api.post<StaffCall>("/api/customer/staff-calls", body).then((r) => r.data),

  getActiveCustomerCalls: (tableName: string) =>
    api
      .get<StaffCall[]>("/api/customer/staff-calls/active", { params: { tableName } })
      .then((r) => r.data),

  cancelCustomerCall: (callId: number, body: CancelStaffCallBody) =>
    api
      .patch<void>(`/api/customer/staff-calls/${callId}/cancel`, body)
      .then((r) => r.data),

  getPendingOperationsCalls: () =>
    api.get<StaffCall[]>("/api/operations/staff-calls").then((r) => r.data),

  acknowledgeOperationsCall: (callId: number) =>
    api.patch<StaffCall>(`/api/operations/staff-calls/${callId}/acknowledge`).then((r) => r.data),
};
```

## 3. WebSocket 훅

신규 파일: `restaurant-book-front/src/entities/staff-call/api/staffCallRealtime.ts`

```ts
"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useAppWebSocketTopic } from "@/shared/hooks/useAppWebSocket";

export type StaffCallChangedPayload = {
  reason?: "CREATED" | "ACKNOWLEDGED" | "CANCELED";
  callId?: number;
  tableName?: string;
};

export function useOperationsStaffCallsWebSocket(
  enabled = true,
  onChanged?: (payload: StaffCallChangedPayload) => void,
) {
  const queryClient = useQueryClient();

  useAppWebSocketTopic("staff-calls:operations", enabled, (message) => {
    if (message.type !== "STAFF_CALL_LIST_CHANGED") {
      return;
    }
    const payload = toPayload(message.data);
    queryClient.invalidateQueries({ queryKey: ["operations-staff-calls"] });
    queryClient.invalidateQueries({ queryKey: ["manager-dashboard"] });
    queryClient.refetchQueries({ queryKey: ["operations-staff-calls"], type: "active" });
    queryClient.refetchQueries({ queryKey: ["manager-dashboard"], type: "active" });
    onChanged?.(payload);
  });
}

export function useCustomerStaffCallsWebSocket(
  tableName: string,
  enabled = true,
  onChanged?: (payload: StaffCallChangedPayload) => void,
) {
  const queryClient = useQueryClient();
  const normalized = tableName.trim();

  useAppWebSocketTopic(
    normalized ? `customer:calls/${normalized}` : null,
    enabled && normalized.length > 0,
    (message) => {
      if (message.type !== "CUSTOMER_CALLS_CHANGED") {
        return;
      }
      const payload = toPayload(message.data);
      queryClient.invalidateQueries({ queryKey: ["customer-active-staff-calls", tableName] });
      queryClient.refetchQueries({ queryKey: ["customer-active-staff-calls", tableName], type: "active" });
      onChanged?.(payload);
    },
  );
}

function toPayload(data: unknown): StaffCallChangedPayload {
  if (!data || typeof data !== "object") return {};
  const r = data as Record<string, unknown>;
  return {
    reason: typeof r.reason === "string" ? (r.reason as StaffCallChangedPayload["reason"]) : undefined,
    callId: typeof r.callId === "number" ? r.callId : undefined,
    tableName: typeof r.tableName === "string" ? r.tableName : undefined,
  };
}
```

## 4. KioskHome 변경

파일: `restaurant-book-front/src/features/kiosk/KioskHome.tsx`

### 4.1 import 추가

```tsx
import { staffCallApi } from "@/entities/staff-call/api/staffCallApi";
import { useCustomerStaffCallsWebSocket } from "@/entities/staff-call/api/staffCallRealtime";
import type { StaffCall, StaffCallType } from "@/entities/staff-call/model/types";
```

`Phone` 아이콘은 이미 import 되어 있다 (line 11). 추가로 `BellRing` 등 필요 시 import.

### 4.2 상태 추가

`KioskHome` 함수 본문 상태 선언부에 추가.

```tsx
const [staffCallDialogOpen, setStaffCallDialogOpen] = useState(false);
const [staffCallType, setStaffCallType] = useState<StaffCallType>("GENERAL");
const [staffCallMessage, setStaffCallMessage] = useState("");
```

### 4.3 데이터 조회 + WebSocket

```tsx
const {
  data: activeStaffCalls = [],
} = useQuery({
  queryKey: ["customer-active-staff-calls", tableName],
  queryFn: () => staffCallApi.getActiveCustomerCalls(tableName),
  enabled: tableName.trim().length > 0,
  refetchInterval: 10000,
});

useCustomerStaffCallsWebSocket(tableName, tableName.trim().length > 0, (payload) => {
  if (payload.reason === "ACKNOWLEDGED") {
    toast.success("직원이 호출을 확인했습니다.");
  }
});
```

### 4.4 뮤테이션

```tsx
const createStaffCallMutation = useMutation({
  mutationFn: () =>
    staffCallApi.createCustomerCall({
      tableName,
      type: staffCallType,
      message: staffCallMessage.trim() || null,
    }),
  onSuccess: () => {
    setStaffCallDialogOpen(false);
    setStaffCallMessage("");
    setStaffCallType("GENERAL");
    queryClient.invalidateQueries({ queryKey: ["customer-active-staff-calls", tableName] });
    toast.success("직원을 호출했습니다.");
  },
  onError: (e) => toastError(e, "직원을 호출하지 못했습니다."),
});

const cancelStaffCallMutation = useMutation({
  mutationFn: (callId: number) => staffCallApi.cancelCustomerCall(callId, { tableName }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["customer-active-staff-calls", tableName] });
    toast.success("호출을 취소했습니다.");
  },
  onError: (e) => toastError(e, "호출을 취소하지 못했습니다."),
});
```

### 4.5 직원 호출 버튼 핸들러

기존 placeholder 버튼(line 731-737)을 활성화한다.

```tsx
<button
  type="button"
  onClick={() => {
    if (!tableName.trim()) {
      toast.error("테이블명이 설정되어야 호출할 수 있습니다.");
      return;
    }
    if (activeStaffCalls.length > 0) {
      toast.info("이미 호출이 진행 중입니다.");
      return;
    }
    setStaffCallDialogOpen(true);
  }}
  className="..."
>
  <Phone className="h-4 w-4" />
  직원 호출
  {activeStaffCalls.length > 0 ? (
    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
      {activeStaffCalls.length}
    </span>
  ) : null}
</button>
```

### 4.6 호출 진행 패널 (후불 결제 안내 위 또는 아래)

`후불 결제 안내` 카드 아래에 진행 중 호출 카드를 추가한다.

```tsx
{activeStaffCalls.length > 0 ? (
  <div className="rounded-md border border-rose-300 bg-rose-50 p-3">
    <div className="flex items-center gap-2 text-rose-800">
      <Phone className="h-4 w-4" />
      <p className="text-sm font-bold">직원 호출 중</p>
    </div>
    <div className="mt-2 space-y-2">
      {activeStaffCalls.map((call) => (
        <StaffCallStatusItem
          key={call.id}
          call={call}
          onCancel={() => cancelStaffCallMutation.mutate(call.id)}
          canceling={cancelStaffCallMutation.isPending && cancelStaffCallMutation.variables === call.id}
        />
      ))}
    </div>
  </div>
) : null}
```

`StaffCallStatusItem`은 같은 파일 하단에 헬퍼 컴포넌트로 추가.

```tsx
function StaffCallStatusItem({
  call,
  onCancel,
  canceling,
}: {
  call: StaffCall;
  onCancel: () => void;
  canceling: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(id);
  }, []);
  const elapsedSec = Math.max(0, Math.floor((now - new Date(call.createdAt).getTime()) / 1000));
  const elapsedLabel = elapsedSec < 60
    ? `${elapsedSec}초 전`
    : `${Math.floor(elapsedSec / 60)}분 전`;

  return (
    <div className="rounded-md bg-background p-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-rose-800">
          {staffCallTypeLabel[call.type]} · {elapsedLabel}
        </p>
        <button
          type="button"
          disabled={canceling}
          onClick={onCancel}
          className="rounded-md border border-rose-200 bg-background px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {canceling ? "취소 중" : "호출 취소"}
        </button>
      </div>
      {call.message ? (
        <p className="mt-1 text-xs text-rose-900">{call.message}</p>
      ) : null}
    </div>
  );
}

const staffCallTypeLabel: Record<StaffCallType, string> = {
  GENERAL: "일반 호출",
  REFILL: "물·반찬 리필",
  QUESTION: "메뉴 문의",
  PAYMENT: "결제 도움",
  OTHER: "기타",
};
```

### 4.7 호출 다이얼로그

`ConfirmDialog`/`NoticeDialog`는 가벼운 메시지 출력용이므로 호출 다이얼로그는 `cancelTarget` 다이얼로그(StaffReadyOrders 패턴)와 같이 직접 마크업한다.

```tsx
{staffCallDialogOpen ? (
  <div
    role="dialog"
    aria-modal="true"
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
  >
    <div className="w-full max-w-md rounded-lg border border-border bg-background p-5 shadow-xl">
      <h2 className="text-lg font-black">직원 호출</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {tableName ? `${tableName}에서 직원을 호출합니다.` : "테이블명이 필요합니다."}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {(["GENERAL", "REFILL", "QUESTION", "PAYMENT", "OTHER"] as StaffCallType[]).map((type) => {
          const selected = staffCallType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setStaffCallType(type)}
              className={cn(
                "h-12 rounded-md border text-sm font-bold transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-accent",
              )}
            >
              {staffCallTypeLabel[type]}
            </button>
          );
        })}
      </div>

      <textarea
        value={staffCallMessage}
        onChange={(e) => setStaffCallMessage(e.target.value)}
        rows={3}
        maxLength={200}
        placeholder={
          staffCallType === "OTHER"
            ? "필요한 도움을 입력해주세요. (필수)"
            : "추가 메시지를 입력해주세요. (선택)"
        }
        className="mt-3 w-full resize-none rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary"
      />

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          disabled={createStaffCallMutation.isPending}
          onClick={() => {
            setStaffCallDialogOpen(false);
            setStaffCallMessage("");
            setStaffCallType("GENERAL");
          }}
          className="h-10 rounded-md border border-border px-4 text-sm font-bold hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          닫기
        </button>
        <button
          type="button"
          disabled={
            createStaffCallMutation.isPending ||
            !tableName.trim() ||
            (staffCallType === "OTHER" && !staffCallMessage.trim())
          }
          onClick={() => createStaffCallMutation.mutate()}
          className="h-10 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {createStaffCallMutation.isPending ? "호출 중" : "호출하기"}
        </button>
      </div>
    </div>
  </div>
) : null}
```

`cn` 유틸과 `StaffReadyOrders.tsx:26` 패턴을 참고하면 import 경로 동일.

## 5. UX 디테일 결정

| 항목 | 정책 |
|------|------|
| 테이블명이 비어 있을 때 | 토스트로 안내. 다이얼로그 안 열림 |
| 이미 호출 중일 때 | 토스트 안내, 다이얼로그 안 열음 (서버에서도 1분 중복 차단하지만 UX 우선 차단) |
| 메시지 미입력 (GENERAL/REFILL/QUESTION/PAYMENT) | 허용 |
| 메시지 미입력 (OTHER) | 버튼 비활성화 |
| 호출 처리 후 | WebSocket → invalidate → 패널 자동 제거. 토스트 표시 |
| 호출 취소 | `cancelStaffCallMutation` 호출 후 즉시 invalidate |
| 사운드 알림 (선택) | 호출 acknowledge 시 `playCancelAlertSound` 같은 보조 톤 추가는 후속 PR 가능 |

## 6. 라벨/i18n

현재 KioskHome은 한국어 하드코딩이다 (`주문 접수하기` 등). 이 기능도 동일하게 한국어 하드코딩으로 시작한다.

`/screen-settings`에 "직원 호출 문구" 항목이 이미 존재하는 것으로 보아 (`screen-settings/page.tsx:14`) 후속 단계에서 site-settings로 라벨 외부화가 가능하다. 이번 PR 스코프는 아니다.

## 완료 기준

- 직원 호출 버튼 클릭 → 다이얼로그 → 유형 + 메시지 → 호출 생성됨.
- 호출 중에는 사이드바 진행 패널이 보이고, 1초 단위 갱신은 안 하지만 5초마다 경과 시간 라벨이 갱신된다.
- 직원이 acknowledge하면 패널이 사라지고 토스트가 뜬다.
- 고객이 호출을 취소하면 패널이 사라지고 토스트가 뜬다.
- 1분 내 재호출 시 서버 409 → `toastError`로 사용자 안내 메시지 노출.
