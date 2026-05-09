"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle2,
  ChefHat,
  Clock3,
  CookingPot,
  Flame,
  ListChecks,
  Package,
  ReceiptText,
  RotateCcw,
  Store,
  Utensils,
  XCircle,
} from "lucide-react";
import { orderApi } from "@/entities/order/api/orderApi";
import { useOperationalOrdersWebSocket } from "@/entities/order/api/orderRealtime";
import type { Order, OrderStatus } from "@/entities/order/model/types";
import { useAuth } from "@/entities/user/model/authStore";
import { toast, toastError } from "@/shared/lib/toast";
import {
  getKitchenHeaderNavVisible,
  setKitchenHeaderNavVisible,
  subscribeKitchenHeaderNavVisibility,
} from "@/shared/lib/kitchenHeaderNavVisibility";
import { cn } from "@/shared/lib/utils";
import { NoticeDialog } from "@/shared/ui/NoticeDialog";
import { OperationalHeaderSettings } from "@/shared/ui/OperationalHeaderSettings";
import { RequireRole } from "@/widgets/guards/RequireRole";

type KitchenStatus = Extract<OrderStatus, "RECEIVED" | "ACCEPTED" | "COOKING" | "READY">;

type CanceledNotice = {
  key: string;
  orderId: number | null;
  orderNo: string | null;
  tableName: string | null;
  message: string;
  receivedAt: Date;
};

const statusColumns: Array<{
  status: KitchenStatus;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  badgeClass: string;
}> = [
  {
    status: "RECEIVED",
    title: "접수 대기",
    description: "주방 확인 전",
    icon: Bell,
    accentClass: "border-amber-300 bg-amber-50/45",
    badgeClass: "border-amber-300 bg-amber-50 text-amber-800",
  },
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
    icon: CheckCircle2,
    accentClass: "border-emerald-300 bg-emerald-50/45",
    badgeClass: "border-emerald-300 bg-emerald-50 text-emerald-800",
  },
];

const statusLabel: Record<KitchenStatus, string> = {
  RECEIVED: "접수 대기",
  ACCEPTED: "접수됨",
  COOKING: "조리중",
  READY: "조리 완료",
};

const nextAction: Partial<Record<KitchenStatus, { label: string; action: "accept" | "start" | "ready" }>> = {
  RECEIVED: { label: "주문 접수", action: "accept" },
  ACCEPTED: { label: "조리 시작", action: "start" },
  COOKING: { label: "조리 완료", action: "ready" },
};

const formatPrice = (value: number) => value.toLocaleString("ko-KR");

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

const isKitchenStatus = (status: OrderStatus): status is KitchenStatus =>
  status === "RECEIVED" || status === "ACCEPTED" || status === "COOKING" || status === "READY";

const kitchenHeaderNavStore = {
  get: getKitchenHeaderNavVisible,
  set: setKitchenHeaderNavVisible,
  subscribe: subscribeKitchenHeaderNavVisibility,
};

export function KitchenOrderBoard() {
  return (
    <RequireRole roles={["ROLE_ADMIN", "ROLE_KITCHEN"]}>
      <KitchenOrderBoardContent />
    </RequireRole>
  );
}

function KitchenOrderBoardContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<KitchenStatus | "ALL">("ALL");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [movingOrderId, setMovingOrderId] = useState<number | null>(null);
  const [canceledNotices, setCanceledNotices] = useState<CanceledNotice[]>([]);
  const [dismissedCanceledOrderIds, setDismissedCanceledOrderIds] = useState<Set<number>>(() => new Set());
  const [cancelNoticeDialogOpen, setCancelNoticeDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<(Order & { status: KitchenStatus }) | null>(null);
  const [cancelMessage, setCancelMessage] = useState("");
  const [cancelError, setCancelError] = useState("");

  useOperationalOrdersWebSocket(true, (payload) => {
    if (payload.reason !== "CANCELED") {
      return;
    }
    const notice: CanceledNotice = {
      key: `${payload.orderId ?? "unknown"}-${Date.now()}`,
      orderId: payload.orderId ?? null,
      orderNo: null,
      tableName: payload.tableName ?? null,
      message: payload.cancelMessage?.trim() || "고객이 주문을 취소했습니다.",
      receivedAt: new Date(),
    };
    setCanceledNotices((current) => [notice, ...current].slice(0, 10));
    toast.error(`${payload.tableName ?? "테이블 미지정"} 주문이 고객에 의해 취소되었습니다.`);
  });

  useEffect(() => {
    const refetchBoard = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      queryClient.refetchQueries({ queryKey: ["kitchen-orders"], type: "active" });
      queryClient.refetchQueries({ queryKey: ["kitchen-canceled-orders"], type: "active" });
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
    refetch,
  } = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: orderApi.getKitchenOrders,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const {
    data: canceledOrders = [],
  } = useQuery({
    queryKey: ["kitchen-canceled-orders"],
    queryFn: orderApi.getCanceledKitchenOrders,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const kitchenOrders = useMemo(
    () => orders.filter((order): order is Order & { status: KitchenStatus } => isKitchenStatus(order.status)),
    [orders],
  );

  const visibleCanceledNotices = useMemo(() => {
    const seen = new Set<number>();
    const fromEvents = canceledNotices.filter((notice) => {
      if (notice.orderId == null) {
        return true;
      }
      if (dismissedCanceledOrderIds.has(notice.orderId)) {
        return false;
      }
      seen.add(notice.orderId);
      return true;
    });
    const fromOrders = canceledOrders
      .filter((order) => order.status === "CANCELED" && order.cancelMessage && !dismissedCanceledOrderIds.has(order.id))
      .filter((order) => {
        if (seen.has(order.id)) {
          return false;
        }
        seen.add(order.id);
        return true;
      })
      .map((order): CanceledNotice => ({
        key: `order-${order.id}`,
        orderId: order.id,
        orderNo: order.orderNo,
        tableName: order.tableName,
        message: order.cancelMessage ?? "주문이 취소되었습니다.",
        receivedAt: new Date(order.updatedAt),
      }));
    return [...fromEvents, ...fromOrders].slice(0, 10);
  }, [canceledNotices, canceledOrders, dismissedCanceledOrderIds]);

  const statusMutation = useMutation({
    mutationFn: async ({ orderId, action }: { orderId: number; action: "accept" | "start" | "ready" }) => {
      setMovingOrderId(orderId);
      if (action === "accept") {
        return orderApi.acceptKitchenOrder(orderId);
      }
      if (action === "start") {
        return orderApi.startCookingKitchenOrder(orderId);
      }
      return orderApi.readyKitchenOrder(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      toast.success("주문 상태를 변경했습니다.");
    },
    onError: (error) => {
      toastError(error, "주문 상태를 변경하지 못했습니다.");
    },
    onSettled: () => setMovingOrderId(null),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, message }: { orderId: number; message: string }) =>
      orderApi.cancelKitchenOrder(orderId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen-canceled-orders"] });
      setCancelTarget(null);
      setCancelMessage("");
      toast.success("주문을 취소했습니다.");
    },
    onError: (error) => {
      toastError(error, "주문을 취소하지 못했습니다.");
    },
  });

  const submitCancel = () => {
    if (!cancelTarget || cancelMutation.isPending) return;
    const message = cancelMessage.trim();
    if (!message) {
      setCancelError("고객에게 표시할 취소 메시지를 입력해주세요.");
      return;
    }
    setCancelError("");
    cancelMutation.mutate({ orderId: cancelTarget.id, message });
  };

  const visibleColumns = useMemo(
    () =>
      activeFilter === "ALL"
        ? statusColumns
        : statusColumns.filter((column) => column.status === activeFilter),
    [activeFilter],
  );

  const counts = useMemo(
    () =>
      statusColumns.reduce(
        (acc, column) => {
          acc[column.status] = kitchenOrders.filter((order) => order.status === column.status).length;
          return acc;
        },
        {} as Record<KitchenStatus, number>,
      ),
    [kitchenOrders],
  );

  const activeCount = kitchenOrders.filter((order) => order.status !== "READY").length;
  const readyCount = counts.READY;

  return (
    <main className="w-full px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto flex max-w-[1720px] flex-col gap-4">
        <section className="border-b border-border pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <CookingPot className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">주방 주문 보드</h1>
                  <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-bold text-sky-700">
                    {user?.username ?? "주방"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  실제 주문 데이터 기준으로 접수부터 조리 완료까지 처리합니다.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <SummaryTile label="접수 대기" value={`${counts.RECEIVED}건`} />
              <SummaryTile label="진행 중" value={`${activeCount}건`} />
              <SummaryTile label="조리 완료" value={`${readyCount}건`} />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
            <FilterButton
              active={activeFilter === "ALL"}
              label="전체"
              count={kitchenOrders.length}
              onClick={() => setActiveFilter("ALL")}
            />
            {statusColumns.map((column) => (
              <FilterButton
                key={column.status}
                active={activeFilter === column.status}
                label={column.title}
                count={counts[column.status]}
                onClick={() => setActiveFilter(column.status)}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {visibleCanceledNotices.length > 0 ? (
              <button
                type="button"
                onClick={() => setCancelNoticeDialogOpen(true)}
                className="relative inline-flex h-10 items-center gap-2 rounded-md border border-red-300 bg-red-50 px-3 text-sm font-semibold text-red-800 transition-colors hover:bg-red-100"
              >
                <Bell className="h-4 w-4" />
                취소
                <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                  {visibleCanceledNotices.length}
                </span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors",
                soundEnabled
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-border bg-background text-muted-foreground hover:bg-accent",
              )}
            >
              <Bell className="h-4 w-4" />
              알림 {soundEnabled ? "켜짐" : "꺼짐"}
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold transition-colors hover:bg-accent"
            >
              <RotateCcw className="h-4 w-4" />
              새로고침
            </button>
            <OperationalHeaderSettings
              store={kitchenHeaderNavStore}
              screenName="주방"
              description="주방 보드에서 사용하는 화면 표시 방식을 조정합니다."
              hiddenDescription="끄면 주방 화면에서 상단 헤더가 숨겨집니다."
            />
          </div>
        </section>

        {isError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            주문 목록을 불러오지 못했습니다.
          </div>
        ) : null}

        <section
          className={cn(
            "grid gap-3",
            activeFilter === "ALL" ? "xl:grid-cols-4 lg:grid-cols-2" : "grid-cols-1",
          )}
        >
          {visibleColumns.map((column) => {
            const columnOrders = kitchenOrders.filter((order) => order.status === column.status);
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
                    <EmptyColumn label="주문 불러오는 중" />
                  ) : columnOrders.length === 0 ? (
                    <EmptyColumn label="대기 주문 없음" />
                  ) : (
                    columnOrders.map((order) => (
                      <KitchenOrderCard
                        key={order.id}
                        order={order}
                        moving={movingOrderId === order.id}
                        canceling={cancelMutation.isPending && cancelTarget?.id === order.id}
                        onMove={(orderId, action) => statusMutation.mutate({ orderId, action })}
                        onCancel={() => {
                          setCancelTarget(order);
                          setCancelMessage("");
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>
      <NoticeDialog
        open={cancelNoticeDialogOpen}
        title="취소 알림"
        tone="error"
        confirmText="확인"
        onConfirm={() => {
          setCancelNoticeDialogOpen(false);
          setDismissedCanceledOrderIds((current) => {
            const next = new Set(current);
            visibleCanceledNotices.forEach((notice) => {
              if (notice.orderId != null) {
                next.add(notice.orderId);
              }
            });
            return next;
          });
          setCanceledNotices([]);
        }}
      >
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            취소된 주문은 주방 보드에서 제외했습니다.
          </p>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {visibleCanceledNotices.map((notice) => (
              <div
                key={notice.key}
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-bold text-red-800">
                    {notice.tableName ?? "테이블 미지정"}
                    {notice.orderNo ? ` · #${notice.orderNo.split("-").at(-1) ?? notice.orderNo}` : ""}
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-red-700">
                    {formatTime(notice.receivedAt.toISOString())}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-red-800">{notice.message}</p>
              </div>
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
              onChange={(event) => { setCancelMessage(event.target.value); setCancelError(""); }}
              rows={4}
              maxLength={500}
              autoFocus
              className={`mt-4 w-full resize-none rounded-md border bg-background p-3 text-sm outline-none focus:border-primary ${cancelError ? "border-red-500" : "border-border"}`}
              placeholder="예: 재료 소진으로 주문이 취소되었습니다. 직원에게 문의해주세요."
            />
            {cancelError && (
              <p className="mt-1.5 text-sm font-medium text-red-600">{cancelError}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCancelTarget(null);
                  setCancelMessage("");
                  setCancelError("");
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
    </main>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function FilterButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent",
      )}
    >
      <span>{label}</span>
      <span className={cn("rounded-md px-1.5 py-0.5 text-xs tabular-nums", active ? "bg-primary-foreground/15" : "bg-muted text-muted-foreground")}>
        {count}
      </span>
    </button>
  );
}

function KitchenOrderCard({
  order,
  moving,
  canceling,
  onMove,
  onCancel,
}: {
  order: Order & { status: KitchenStatus };
  moving: boolean;
  canceling: boolean;
  onMove: (orderId: number, action: "accept" | "start" | "ready") => void;
  onCancel: () => void;
}) {
  const action = nextAction[order.status];
  const isTakeout = order.orderType === "TAKEOUT";
  const shortOrderNo = order.orderNo.split("-").at(-1) ?? order.orderNo;

  return (
    <article className="rounded-md border border-border bg-background p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-muted-foreground">#{shortOrderNo}</span>
            <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-semibold">
              {statusLabel[order.status]}
            </span>
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
            {item.components.length > 0 ? (
              <div className="mt-2 space-y-1 border-t border-border/60 pt-2">
                {item.components.map((component) => (
                  <div
                    key={`${item.id}-${component.name}`}
                    className="flex items-center justify-between gap-2 text-xs text-muted-foreground"
                  >
                    <span className="truncate">{component.name}</span>
                    <span className="shrink-0 font-semibold">x{component.quantity}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        {action ? (
          <button
            type="button"
            disabled={moving}
            onClick={() => onMove(order.id, action.action)}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ChefHat className="h-4 w-4" />
            {moving ? "처리 중" : action.label}
          </button>
        ) : (
          <div className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 text-sm font-bold text-emerald-800">
            <ReceiptText className="h-4 w-4" />
            직원 결제 대기
          </div>
        )}
        <button
          type="button"
          disabled={canceling}
          onClick={onCancel}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-red-300 bg-red-50 px-3 text-sm font-bold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <XCircle className="h-4 w-4" />
          {canceling ? "취소 중" : "주문 취소"}
        </button>
      </div>
    </article>
  );
}

function EmptyColumn({ label }: { label: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed border-border bg-background/70 p-4 text-center">
      <div>
        <Utensils className="mx-auto h-5 w-5 text-muted-foreground" />
        <p className="mt-2 text-sm font-semibold text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
