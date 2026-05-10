"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  Bell,
  CheckCircle2,
  Clock3,
  CreditCard,
  Flame,
  ListChecks,
  Package,
  PhoneCall,
  ReceiptText,
  Store,
  Trash2,
  XCircle,
} from "lucide-react";
import { orderApi } from "@/entities/order/api/orderApi";
import { useOperationalOrdersWebSocket } from "@/entities/order/api/orderRealtime";
import type { Order, OrderStatus } from "@/entities/order/model/types";
import type { PaymentMethod } from "@/entities/payment/model/types";
import { staffCallApi } from "@/entities/staff-call/api/staffCallApi";
import { useOperationsStaffCallsWebSocket } from "@/entities/staff-call/api/staffCallRealtime";
import type { StaffCall, StaffCallType } from "@/entities/staff-call/model/types";
import { toast, toastError } from "@/shared/lib/toast";
import {
  getStaffHeaderNavVisible,
  setStaffHeaderNavVisible,
  subscribeStaffHeaderNavVisibility,
} from "@/shared/lib/kitchenHeaderNavVisibility";
import { cn } from "@/shared/lib/utils";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { NoticeDialog } from "@/shared/ui/NoticeDialog";
import { OperationalHeaderSettings } from "@/shared/ui/OperationalHeaderSettings";
import { RequireRole } from "@/widgets/guards/RequireRole";

type StaffStatus = Extract<OrderStatus, "ACCEPTED" | "COOKING" | "READY" | "COMPLETED">;

const formatPrice = (value: number) => value.toLocaleString("ko-KR");
const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

const statusColumns: Array<{
  status: StaffStatus;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  badgeClass: string;
}> = [
  {
    status: "ACCEPTED",
    title: "접수됨",
    description: "조리 시작 대기",
    icon: ListChecks,
    accentClass: "border-sky-300 bg-sky-50/45",
    badgeClass: "border-sky-300 bg-sky-50 text-sky-800",
  },
  {
    status: "COOKING",
    title: "조리중",
    description: "주방 진행",
    icon: Flame,
    accentClass: "border-rose-300 bg-rose-50/45",
    badgeClass: "border-rose-300 bg-rose-50 text-rose-800",
  },
  {
    status: "READY",
    title: "조리 완료",
    description: "결제 대기",
    icon: CreditCard,
    accentClass: "border-emerald-300 bg-emerald-50/45",
    badgeClass: "border-emerald-300 bg-emerald-50 text-emerald-800",
  },
  {
    status: "COMPLETED",
    title: "결제 완료",
    description: "주문 종료",
    icon: CheckCircle2,
    accentClass: "border-zinc-300 bg-zinc-50/70",
    badgeClass: "border-zinc-300 bg-zinc-50 text-zinc-800",
  },
];

const statusLabel: Record<StaffStatus, string> = {
  ACCEPTED: "접수됨",
  COOKING: "조리중",
  READY: "조리 완료",
  COMPLETED: "결제 완료",
};

const paymentMethodLabel: Record<PaymentMethod, string> = {
  CARD: "카드",
  CASH: "현금",
  EASY_PAY: "간편결제",
  TRANSFER: "계좌이체",
  ETC: "기타",
};

const staffCallTypeLabel: Record<StaffCallType, string> = {
  GENERAL: "일반 호출",
  REFILL: "물/반찬 리필",
  QUESTION: "메뉴 문의",
  PAYMENT: "결제 도움",
  OTHER: "기타",
};

const headerTileClass =
  "flex h-[4.25rem] w-[5.75rem] shrink-0 flex-col items-center justify-center rounded-md border px-3 text-center";

const isStaffStatus = (status: OrderStatus): status is StaffStatus =>
  status === "ACCEPTED" || status === "COOKING" || status === "READY" || status === "COMPLETED";

const getPaymentLabel = (order: Order) =>
  order.paymentProviderMethod?.trim() ||
  (order.paymentMethod ? paymentMethodLabel[order.paymentMethod] : null);

const staffHeaderNavStore = {
  get: getStaffHeaderNavVisible,
  set: setStaffHeaderNavVisible,
  subscribe: subscribeStaffHeaderNavVisibility,
};

const paymentMethods: Array<{
  method: PaymentMethod;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { method: "CARD", label: "카드", icon: CreditCard },
  { method: "CASH", label: "현금", icon: Banknote },
  { method: "ETC", label: "기타", icon: ReceiptText },
];

const playStaffCallAlert = () => {
  if (typeof window === "undefined") return;
  const audioWindow = window as Window & {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioContextClass = audioWindow.AudioContext || audioWindow.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    const audioContext = new AudioContextClass();
    const playTone = (startTime: number, frequency: number) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, startTime);
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.3);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.32);
    };

    const now = audioContext.currentTime;
    playTone(now, 880);
    playTone(now + 0.18, 1175);
    window.setTimeout(() => void audioContext.close(), 900);
  } catch {
    // Browser audio can be blocked until the staff screen has user activation.
  }
};

export function StaffReadyOrders() {
  return (
    <RequireRole roles={["ROLE_ADMIN", "ROLE_MANAGER", "ROLE_STAFF"]}>
      <StaffOrderBoardContent />
    </RequireRole>
  );
}

function StaffOrderBoardContent() {
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelMessage, setCancelMessage] = useState("");
  const [cancelNoticeDialogOpen, setCancelNoticeDialogOpen] = useState(false);
  const [confirmedCanceledOrderIds, setConfirmedCanceledOrderIds] = useState<Set<number>>(() => new Set());
  const [staffCallDialogOpen, setStaffCallDialogOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<Order | null>(null);
  const [refundTarget, setRefundTarget] = useState<Order | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("CARD");
  useOperationalOrdersWebSocket();
  useOperationsStaffCallsWebSocket(true, (payload) => {
    if (payload.reason === "CREATED") {
      playStaffCallAlert();
      toast.info(`${payload.tableName ? `${payload.tableName} · ` : ""}직원 호출이 들어왔습니다.`);
    }
  });

  useEffect(() => {
    const refetchBoard = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      queryClient.refetchQueries({ queryKey: ["operation-orders"], type: "active" });
      queryClient.refetchQueries({ queryKey: ["operation-canceled-orders"], type: "active" });
      queryClient.refetchQueries({ queryKey: ["operations-staff-calls"], type: "active" });
    };
    window.addEventListener("focus", refetchBoard);
    document.addEventListener("visibilitychange", refetchBoard);
    return () => {
      window.removeEventListener("focus", refetchBoard);
      document.removeEventListener("visibilitychange", refetchBoard);
    };
  }, [queryClient]);

  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["operation-orders"],
    queryFn: orderApi.getOperationOrders,
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
  });

  const {
    data: canceledOrders = [],
  } = useQuery({
    queryKey: ["operation-canceled-orders"],
    queryFn: orderApi.getCanceledOperationOrders,
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
  });

  const {
    data: staffCalls = [],
  } = useQuery({
    queryKey: ["operations-staff-calls"],
    queryFn: staffCallApi.getPendingOperationsCalls,
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
  });

  const boardOrders = useMemo(
    () => orders.filter((order): order is Order & { status: StaffStatus } => isStaffStatus(order.status)),
    [orders],
  );

  const visibleCanceledOrders = useMemo(
    () => canceledOrders.filter((order) => order.status === "CANCELED" && order.cancelMessage),
    [canceledOrders],
  );

  const pendingCanceledOrders = useMemo(
    () => visibleCanceledOrders.filter((order) => !confirmedCanceledOrderIds.has(order.id)),
    [confirmedCanceledOrderIds, visibleCanceledOrders],
  );

  const confirmedCanceledOrders = useMemo(
    () => visibleCanceledOrders.filter((order) => confirmedCanceledOrderIds.has(order.id)),
    [confirmedCanceledOrderIds, visibleCanceledOrders],
  );

  useEffect(() => {
    const visibleIds = new Set(visibleCanceledOrders.map((order) => order.id));
    setConfirmedCanceledOrderIds((current) => {
      const next = new Set([...current].filter((orderId) => visibleIds.has(orderId)));
      return next.size === current.size ? current : next;
    });
  }, [visibleCanceledOrders]);

  const counts = useMemo(
    () =>
      statusColumns.reduce(
        (acc, column) => {
          acc[column.status] = boardOrders.filter((order) => order.status === column.status).length;
          return acc;
        },
        {} as Record<StaffStatus, number>,
      ),
    [boardOrders],
  );

  const completeMutation = useMutation({
    mutationFn: ({ orderId, paymentMethod }: { orderId: number; paymentMethod: PaymentMethod }) =>
      orderApi.completeOperationOrder(orderId, { paymentMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operation-orders"] });
      queryClient.invalidateQueries({ queryKey: ["operation-ready-orders"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.refetchQueries({ queryKey: ["operation-orders"], type: "active" });
      queryClient.refetchQueries({ queryKey: ["operation-ready-orders"], type: "active" });
      setPaymentTarget(null);
      toast.success("결제 완료로 처리했습니다.");
    },
    onError: (error) => toastError(error, "결제 완료 처리를 하지 못했습니다."),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, message }: { orderId: number; message: string }) =>
      orderApi.cancelOperationOrder(orderId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operation-orders"] });
      setCancelTarget(null);
      setCancelMessage("");
      toast.success("주문을 취소했습니다.");
    },
    onError: (error) => toastError(error, "주문을 취소하지 못했습니다."),
  });

  const acknowledgeCanceledMutation = useMutation({
    mutationFn: orderApi.acknowledgeOperationCanceledOrders,
    onSuccess: (_data, tableName) => {
      setConfirmedCanceledOrderIds((current) => {
        const next = new Set(current);
        visibleCanceledOrders.forEach((order) => {
          if (order.tableName === tableName) {
            next.delete(order.id);
          }
        });
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["operation-canceled-orders"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen-canceled-orders"] });
      toast.success("취소 안내를 정리했습니다.");
    },
    onError: (error) => toastError(error, "취소 안내를 정리하지 못했습니다."),
  });

  const acknowledgeStaffCallMutation = useMutation({
    mutationFn: (callId: number) => staffCallApi.acknowledgeOperationsCall(callId),
    onMutate: async (callId) => {
      await queryClient.cancelQueries({ queryKey: ["operations-staff-calls"] });
      const previousCalls = queryClient.getQueryData<StaffCall[]>(["operations-staff-calls"]) ?? [];
      queryClient.setQueryData<StaffCall[]>(
        ["operations-staff-calls"],
        (current) => current?.filter((call) => call.id !== callId) ?? [],
      );
      return { previousCalls };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations-staff-calls"] });
      queryClient.refetchQueries({ queryKey: ["operations-staff-calls"], type: "active" });
      toast.success("호출을 처리 완료했습니다.");
    },
    onError: (error, _callId, context) => {
      if (context?.previousCalls) {
        queryClient.setQueryData(["operations-staff-calls"], context.previousCalls);
      }
      toastError(error, "호출을 처리 완료하지 못했습니다.");
    },
  });

  const refundMutation = useMutation({
    mutationFn: orderApi.refundOperationOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operation-orders"] });
      queryClient.invalidateQueries({ queryKey: ["operation-canceled-orders"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.refetchQueries({ queryKey: ["operation-orders"], type: "active" });
      setRefundTarget(null);
      toast.success("환불 처리했습니다.");
    },
    onError: (error) => toastError(error, "환불 처리하지 못했습니다."),
  });

  const submitCancel = () => {
    if (!cancelTarget || cancelMutation.isPending) return;
    const message = cancelMessage.trim();
    if (!message) {
      toast.error("고객에게 표시할 취소 메시지를 입력해주세요.");
      return;
    }
    cancelMutation.mutate({ orderId: cancelTarget.id, message });
  };

  const submitPayment = () => {
    if (!paymentTarget || completeMutation.isPending) return;
    completeMutation.mutate({
      orderId: paymentTarget.id,
      paymentMethod: selectedPaymentMethod,
    });
  };

  const submitRefund = () => {
    if (!refundTarget || refundMutation.isPending) return;
    refundMutation.mutate(refundTarget.id);
  };

  return (
    <main className="w-full px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto flex max-w-[1720px] flex-col gap-4">
        <section className="border-b border-border pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <CreditCard className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">직원 주문 보드</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  주방 진행 상태를 확인하고 조리 완료 주문을 결제 완료 처리합니다.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              {visibleCanceledOrders.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setCancelNoticeDialogOpen(true)}
                  className={cn(
                    headerTileClass,
                    "gap-2 border-red-300 bg-red-50 text-sm font-bold text-red-800 transition-colors hover:bg-red-100",
                  )}
                >
                  <Bell className="h-4 w-4" />
                  취소({visibleCanceledOrders.length})
                </button>
              ) : null}
              {staffCalls.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setStaffCallDialogOpen(true)}
                  className={cn(
                    headerTileClass,
                    "animate-pulse gap-2 border-rose-300 bg-rose-50 text-sm font-bold text-rose-800 transition-colors hover:bg-rose-100",
                  )}
                >
                  <PhoneCall className="h-4 w-4" />
                  호출({staffCalls.length})
                </button>
              ) : null}
              <SummaryTile label="진행 중" value={`${counts.ACCEPTED + counts.COOKING}건`} />
              <SummaryTile label="결제 대기" value={`${counts.READY}건`} />
              <SummaryTile label="결제 완료" value={`${counts.COMPLETED}건`} />
              <OperationalHeaderSettings
                store={staffHeaderNavStore}
                screenName="직원"
                description="직원 주문 보드에서 사용하는 화면 표시 방식을 조정합니다."
                hiddenDescription="끄면 직원 화면에서 상단 헤더가 숨겨집니다."
                buttonClassName={cn(headerTileClass, "gap-1 px-0 text-muted-foreground")}
                iconClassName="h-4 w-4"
                buttonLabel="설정"
              />
            </div>
          </div>
        </section>

        {isError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            직원 주문 보드를 불러오지 못했습니다.
          </div>
        ) : null}

        <section className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
          {statusColumns.map((column) => {
            const columnOrders = boardOrders.filter((order) => order.status === column.status);
            const Icon = column.icon;
            return (
              <div
                key={column.status}
                className={cn("min-h-[560px] rounded-md border p-3", column.accentClass)}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background/90">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold">{column.title}</h2>
                      <p className="text-xs text-muted-foreground">{column.description}</p>
                    </div>
                  </div>
                  <span className={cn("rounded-md border px-2 py-1 text-xs font-bold", column.badgeClass)}>
                    {columnOrders.length}건
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {isLoading ? (
                    <EmptyState label="주문 불러오는 중" />
                  ) : columnOrders.length === 0 ? (
                    <EmptyState label="대기 주문 없음" />
                  ) : (
                    columnOrders.map((order) => (
                      <StaffOrderCard
                        key={order.id}
                        order={order}
                        completing={completeMutation.isPending && completeMutation.variables?.orderId === order.id}
                        canceling={cancelMutation.isPending && cancelTarget?.id === order.id}
                        refunding={refundMutation.isPending && refundMutation.variables === order.id}
                        onComplete={() => {
                          setPaymentTarget(order);
                          setSelectedPaymentMethod("CARD");
                        }}
                        onCancel={() => {
                          setCancelTarget(order);
                          setCancelMessage("");
                        }}
                        onRefund={() => setRefundTarget(order)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>

      {cancelNoticeDialogOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-notice-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
        >
          <div className="w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-background shadow-xl">
            <div className="flex items-center gap-3 bg-red-50 px-5 py-4 text-red-700">
              <XCircle className="h-6 w-6 shrink-0 text-red-600" />
              <h2 id="cancel-notice-dialog-title" className="text-lg font-black tracking-tight">
                취소 안내
              </h2>
            </div>
            <div className="p-5">
              <p className="text-sm font-semibold text-foreground">
                고객에게 취소 사유를 설명한 뒤 확인 완료로 옮기고, 정리할 때 목록에서 제거합니다.
              </p>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <section className="min-h-72 rounded-md border border-red-200 bg-red-50/55 p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-red-900">확인 필요</h3>
                      <p className="mt-0.5 text-xs font-semibold text-red-700">고객 설명 전</p>
                    </div>
                    <span className="rounded-md border border-red-200 bg-background px-2 py-1 text-xs font-bold text-red-800">
                      {pendingCanceledOrders.length}건
                    </span>
                  </div>
                  <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
                    {pendingCanceledOrders.length === 0 ? (
                      <CancelNoticeEmpty label="확인할 취소 없음" />
                    ) : null}
                    {pendingCanceledOrders.map((order) => (
                      <CanceledNoticeCard
                        key={order.id}
                        order={order}
                        actionLabel="확인 완료"
                        actionIcon={CheckCircle2}
                        actionClassName="bg-red-600 text-white hover:bg-red-700"
                        onAction={() => {
                          setConfirmedCanceledOrderIds((current) => new Set(current).add(order.id));
                        }}
                      />
                    ))}
                  </div>
                </section>

                <section className="min-h-72 rounded-md border border-zinc-200 bg-zinc-50/70 p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-zinc-900">확인 완료</h3>
                      <p className="mt-0.5 text-xs font-semibold text-muted-foreground">정리 대기</p>
                    </div>
                    <span className="rounded-md border border-zinc-200 bg-background px-2 py-1 text-xs font-bold text-zinc-800">
                      {confirmedCanceledOrders.length}건
                    </span>
                  </div>
                  <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
                    {confirmedCanceledOrders.length === 0 ? (
                      <CancelNoticeEmpty label="정리 대기 없음" />
                    ) : null}
                    {confirmedCanceledOrders.map((order) => (
                      <CanceledNoticeCard
                        key={order.id}
                        order={order}
                        actionLabel={
                          acknowledgeCanceledMutation.isPending &&
                          acknowledgeCanceledMutation.variables === order.tableName
                            ? "정리 중"
                            : "정리"
                        }
                        actionIcon={Trash2}
                        actionClassName="border border-zinc-300 bg-background text-zinc-800 hover:bg-zinc-100"
                        disabled={!order.tableName || acknowledgeCanceledMutation.isPending}
                        onAction={() => {
                          if (!order.tableName) return;
                          acknowledgeCanceledMutation.mutate(order.tableName);
                        }}
                      />
                    ))}
                  </div>
                </section>
              </div>
            </div>
            <div className="border-t border-border bg-muted/20 px-5 py-4">
              <button
                type="button"
                onClick={() => setCancelNoticeDialogOpen(false)}
                className="flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <NoticeDialog
        open={staffCallDialogOpen}
        title="직원 호출"
        tone="info"
        confirmText="닫기"
        onConfirm={() => setStaffCallDialogOpen(false)}
      >
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            테이블 요청을 처리 완료하면 고객 화면의 호출 중 상태가 종료됩니다.
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

      {cancelTarget ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-5 shadow-xl">
            <h2 className="text-lg font-black">주문 취소</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              고객 태블릿에 표시할 취소 메시지를 입력합니다.
            </p>
            <textarea
              value={cancelMessage}
              onChange={(event) => setCancelMessage(event.target.value)}
              rows={4}
              maxLength={500}
              className="mt-4 w-full resize-none rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary"
              placeholder="예: 재료 소진으로 주문이 취소되었습니다. 직원에게 문의해주세요."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCancelTarget(null);
                  setCancelMessage("");
                }}
                className="h-10 rounded-md border border-border px-4 text-sm font-bold hover:bg-accent"
              >
                닫기
              </button>
              <button
                type="button"
                disabled={cancelMutation.isPending}
                onClick={submitCancel}
                className="h-10 rounded-md bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelMutation.isPending ? "취소 중" : "취소 확정"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {paymentTarget ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-5 shadow-xl">
            <h2 className="text-lg font-black">결제 완료</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              결제수단을 선택한 뒤 주문을 종료합니다.
            </p>
            <div className="mt-4 rounded-md border border-border bg-muted/35 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {paymentTarget.tableName ?? "테이블 미지정"} · #{paymentTarget.orderNo.split("-").at(-1) ?? paymentTarget.orderNo}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">결제 금액</p>
                </div>
                <p className="shrink-0 text-lg font-black">{formatPrice(paymentTarget.totalAmount)}원</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {paymentMethods.map((item) => {
                const Icon = item.icon;
                const selected = selectedPaymentMethod === item.method;
                return (
                  <button
                    key={item.method}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(item.method)}
                    className={cn(
                      "flex h-20 flex-col items-center justify-center gap-2 rounded-md border text-sm font-bold transition-colors",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-accent",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={completeMutation.isPending}
                onClick={() => setPaymentTarget(null)}
                className="h-10 rounded-md border border-border px-4 text-sm font-bold hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                닫기
              </button>
              <button
                type="button"
                disabled={completeMutation.isPending}
                onClick={submitPayment}
                className="h-10 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {completeMutation.isPending ? "처리 중" : "결제 완료"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(refundTarget)}
        title="환불 처리"
        description={
          refundTarget
            ? `${refundTarget.tableName ?? "테이블 미지정"} · #${refundTarget.orderNo.split("-").at(-1) ?? refundTarget.orderNo}\n${formatPrice(refundTarget.totalAmount)}원을 환불 처리합니다.`
            : undefined
        }
        confirmText="환불 처리"
        cancelText="닫기"
        variant="destructive"
        loading={refundMutation.isPending}
        onConfirm={submitRefund}
        onCancel={() => {
          if (refundMutation.isPending) return;
          setRefundTarget(null);
        }}
      >
        {refundTarget ? (
          <div className="rounded-md border border-border bg-muted/35 p-3">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
              <span className="text-sm font-bold">주문 정보</span>
              <span className="text-sm font-black tabular-nums">{formatPrice(refundTarget.totalAmount)}원</span>
            </div>
            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
              {refundTarget.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-2">
                  <span className="min-w-0 truncate text-sm font-semibold">{item.name}</span>
                  <span className="shrink-0 text-sm font-bold">x{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </ConfirmDialog>
    </main>
  );
}

function CanceledNoticeCard({
  order,
  actionLabel,
  actionIcon: ActionIcon,
  actionClassName,
  disabled = false,
  onAction,
}: {
  order: Order;
  actionLabel: string;
  actionIcon: React.ComponentType<{ className?: string }>;
  actionClassName: string;
  disabled?: boolean;
  onAction: () => void;
}) {
  const shortOrderNo = order.orderNo.split("-").at(-1) ?? order.orderNo;

  return (
    <div className="rounded-md border border-red-200 bg-background px-3 py-2 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-red-800">
            {order.tableName ?? "테이블 미지정"} · #{shortOrderNo}
          </p>
          <p className="mt-1 text-xs font-semibold text-red-700">
            {formatTime(order.updatedAt)}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onAction}
          className={cn(
            "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            actionClassName,
          )}
        >
          <ActionIcon className="h-3.5 w-3.5" />
          {actionLabel}
        </button>
      </div>
      <p className="mt-2 text-sm font-semibold text-red-800">{order.cancelMessage}</p>
    </div>
  );
}

function CancelNoticeEmpty({ label }: { label: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed border-border bg-background/70 p-4 text-center">
      <div>
        <ReceiptText className="mx-auto h-5 w-5 text-muted-foreground" />
        <p className="mt-2 text-sm font-semibold text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

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
          {processing ? "처리 중" : "처리 완료"}
        </button>
      </div>
      {call.message ? (
        <p className="mt-2 text-sm font-semibold text-rose-800">{call.message}</p>
      ) : null}
    </div>
  );
}

function StaffOrderCard({
  order,
  completing,
  canceling,
  refunding,
  onComplete,
  onCancel,
  onRefund,
}: {
  order: Order & { status: StaffStatus };
  completing: boolean;
  canceling: boolean;
  refunding: boolean;
  onComplete: () => void;
  onCancel: () => void;
  onRefund: () => void;
}) {
  const isTakeout = order.orderType === "TAKEOUT";
  const shortOrderNo = order.orderNo.split("-").at(-1) ?? order.orderNo;
  const paymentLabel = order.status === "COMPLETED" ? getPaymentLabel(order) : null;

  return (
    <article className="rounded-md border border-border bg-background p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-muted-foreground">#{shortOrderNo}</span>
            <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-semibold">
              {statusLabel[order.status]}
            </span>
            {paymentLabel ? (
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {paymentLabel}
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex items-center gap-2 text-lg font-bold">
            {isTakeout ? <Package className="h-5 w-5" /> : <Store className="h-5 w-5" />}
            <span className="truncate">{order.tableName ?? "테이블 미지정"}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            {formatTime(order.createdAt)}
          </div>
          <p className="mt-1 text-sm font-bold">{formatPrice(order.totalAmount)}원</p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {order.items.map((item) => (
          <div key={item.id} className="rounded-md bg-muted/55 p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-sm font-bold">{item.name}</span>
              <span className="shrink-0 rounded-md bg-background px-2 py-0.5 text-xs font-bold">
                x{item.quantity}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        {order.status === "READY" ? (
          <button
            type="button"
            disabled={completing}
            onClick={onComplete}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            {completing ? "처리 중" : "결제 완료"}
          </button>
        ) : null}
        {order.status !== "COMPLETED" ? (
          <button
            type="button"
            disabled={canceling}
            onClick={onCancel}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-red-300 bg-red-50 px-3 text-sm font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <XCircle className="h-4 w-4" />
            {canceling ? "취소 중" : "주문 취소"}
          </button>
        ) : null}
        {order.status === "COMPLETED" ? (
          <button
            type="button"
            disabled={refunding}
            onClick={onRefund}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-red-300 bg-red-50 px-3 text-sm font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <XCircle className="h-4 w-4" />
            {refunding ? "환불 중" : "환불"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn(headerTileClass, "border-border bg-background")}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed border-border bg-background/70 p-4 text-center">
      <div>
        <ReceiptText className="mx-auto h-5 w-5 text-muted-foreground" />
        <p className="mt-2 text-sm font-semibold text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
