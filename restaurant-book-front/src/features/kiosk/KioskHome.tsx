"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  XCircle,
  ImageIcon,
  Minus,
  Package,
  Phone,
  Plus,
  ReceiptText,
  ShoppingBag,
  Store,
  Utensils,
} from "lucide-react";
import { customerSaleProductApi } from "@/entities/customer-sale-product/api/customerSaleProductApi";
import type {
  CustomerOrderType,
  CustomerSaleProduct,
  SaleProductType,
} from "@/entities/customer-sale-product/model/types";
import { orderApi } from "@/entities/order/api/orderApi";
import { useCustomerOrdersWebSocket } from "@/entities/order/api/orderRealtime";
import type { Order } from "@/entities/order/model/types";
import { saleMenuCategoryApi } from "@/entities/sale-menu-category/api/saleMenuCategoryApi";
import { staffCallApi } from "@/entities/staff-call/api/staffCallApi";
import { useCustomerStaffCallsWebSocket } from "@/entities/staff-call/api/staffCallRealtime";
import type { StaffCall, StaffCallType } from "@/entities/staff-call/model/types";
import { toast, toastError } from "@/shared/lib/toast";
import { tableSessionStorage } from "@/shared/lib/tableSessionStorage";
import { cn } from "@/shared/lib/utils";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { NoticeDialog } from "@/shared/ui/NoticeDialog";

type KioskOrderType = "dine-in" | "takeout";

type KioskTab =
  | { type: "SET"; label: string }
  | { type: "MENU"; categoryId: number; label: string };

type CartItemKey = `${SaleProductType}:${number}`;

type CartItem = {
  key: CartItemKey;
  type: SaleProductType;
  id: number;
  name: string;
  price: number;
  quantity: number;
  components: {
    name: string;
    quantity: number;
  }[];
};

type CancelNotice = {
  key: string;
  orderId: number | null;
  orderNo: string | null;
  message: string;
  receivedAt: Date;
};

const SET_TAB: KioskTab = { type: "SET", label: "세트" };

const formatPrice = (value: number) => value.toLocaleString("ko-KR");

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

const playCancelAlertSound = () => {
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
      gain.gain.exponentialRampToValueAtTime(0.14, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.24);
    };

    const now = audioContext.currentTime;
    playTone(now, 740);
    playTone(now + 0.28, 520);
    window.setTimeout(() => void audioContext.close(), 900);
  } catch {
    // Browser audio can be blocked until the kiosk has user activation.
  }
};

const orderStatusLabel: Record<Order["status"], string> = {
  RECEIVED: "주문 접수 대기",
  ACCEPTED: "주문 접수 완료",
  COOKING: "조리 중",
  READY: "조리 완료/결제 대기",
  COMPLETED: "결제 완료",
  CANCELED: "취소",
};

const orderStatusBadgeClass: Record<Order["status"], string> = {
  RECEIVED: "border-amber-500/30 bg-amber-50 text-amber-700",
  ACCEPTED: "border-sky-500/30 bg-sky-50 text-sky-700",
  COOKING: "border-blue-500/30 bg-blue-50 text-blue-700",
  READY: "border-emerald-500/30 bg-emerald-50 text-emerald-700",
  COMPLETED: "border-slate-500/30 bg-slate-50 text-slate-700",
  CANCELED: "border-red-500/30 bg-red-50 text-red-700",
};

const orderStatusCardClass: Record<Order["status"], string> = {
  RECEIVED: "border-amber-300 bg-background shadow-[inset_4px_0_0_rgb(245_158_11)]",
  ACCEPTED: "border-sky-300 bg-background shadow-[inset_4px_0_0_rgb(14_165_233)]",
  COOKING: "border-blue-300 bg-background shadow-[inset_4px_0_0_rgb(59_130_246)]",
  READY: "border-emerald-300 bg-background shadow-[inset_4px_0_0_rgb(16_185_129)]",
  COMPLETED: "border-slate-300 bg-background shadow-[inset_4px_0_0_rgb(100_116_139)]",
  CANCELED: "border-red-300 bg-background shadow-[inset_4px_0_0_rgb(239_68_68)]",
};

const staffCallTypeLabel: Record<StaffCallType, string> = {
  GENERAL: "일반 호출",
  REFILL: "물/반찬 리필",
  QUESTION: "메뉴 문의",
  PAYMENT: "결제 도움",
  OTHER: "기타",
};

const toCustomerOrderType = (orderType: KioskOrderType): CustomerOrderType =>
  orderType === "dine-in" ? "DINE_IN" : "TAKEOUT";

const toCartKey = (type: SaleProductType, id: number): CartItemKey => `${type}:${id}`;

function OrderStatusBadge({ status }: { status: Order["status"] }) {
  return (
    <span
      className={`shrink-0 rounded-md border px-2 py-1 text-xs font-bold ${orderStatusBadgeClass[status]}`}
    >
      {orderStatusLabel[status]}
    </span>
  );
}

export function KioskHome() {
  const queryClient = useQueryClient();
  const [orderType, setOrderType] = useState<KioskOrderType>("dine-in");
  const [activeTab, setActiveTab] = useState<KioskTab>(SET_TAB);
  const [cart, setCart] = useState<Record<CartItemKey, CartItem>>({});
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [canceledOrder, setCanceledOrder] = useState<Order | null>(null);
  const [cancelNotices, setCancelNotices] = useState<CancelNotice[]>([]);
  const [dismissedCanceledOrderIds, setDismissedCanceledOrderIds] = useState<Set<number>>(() => new Set());
  const [cancelNoticesOpen, setCancelNoticesOpen] = useState(false);
  const [activeCancelNotice, setActiveCancelNotice] = useState<CancelNotice | null>(null);
  const [orderConfirmOpen, setOrderConfirmOpen] = useState(false);
  const [tableName, setTableName] = useState("");
  const [staffCallDialogOpen, setStaffCallDialogOpen] = useState(false);
  const [staffCallType, setStaffCallType] = useState<StaffCallType>("GENERAL");
  const [staffCallMessage, setStaffCallMessage] = useState("");
  const [basicRequestSelected, setBasicRequestSelected] = useState<Set<string>>(new Set());

  const customerOrderType = toCustomerOrderType(orderType);

  useEffect(() => {
    const syncTableName = () => setTableName(tableSessionStorage.getTableName());
    syncTableName();
    return tableSessionStorage.subscribe(syncTableName);
  }, []);
  useCustomerOrdersWebSocket(tableName, tableName.trim().length > 0, (payload) => {
    const message = payload.cancelMessage?.trim();
    if (payload.reason !== "CANCELED" || !message) {
      return;
    }
    const currentOrders =
      queryClient.getQueryData<Order[]>(["customer-active-orders", tableName]) ?? [];
    const canceled = currentOrders.find((order) => order.id === payload.orderId) ?? null;
    const notice: CancelNotice = {
      key: `${payload.orderId ?? "unknown"}-${Date.now()}`,
      orderId: payload.orderId ?? null,
      orderNo: canceled?.orderNo ?? null,
      message,
      receivedAt: new Date(),
    };
    setCancelNotices((current) => [
      notice,
      ...current,
    ].slice(0, 10));
    setActiveCancelNotice(notice);
    playCancelAlertSound();
    toast.error("주문 취소 안내가 도착했습니다.");
  });
  useCustomerStaffCallsWebSocket(tableName, tableName.trim().length > 0, (payload) => {
    if (payload.reason === "ACKNOWLEDGED") {
      toast.success("직원이 호출을 확인했습니다.");
    }
  });

  useEffect(() => {
    if (!activeCancelNotice) return;
    const timer = window.setTimeout(() => setActiveCancelNotice(null), 10000);
    return () => window.clearTimeout(timer);
  }, [activeCancelNotice]);

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useQuery({
    queryKey: ["sale-menu-categories", "customer-tabs"],
    queryFn: () => saleMenuCategoryApi.list(),
  });

  const visibleCategories = useMemo(
    () =>
      categories
        .filter((category) => category.visible)
        .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id),
    [categories]
  );

  const tabs = useMemo<KioskTab[]>(
    () => [
      SET_TAB,
      ...visibleCategories.map((category) => ({
        type: "MENU" as const,
        categoryId: category.id,
        label: category.name,
      })),
    ],
    [visibleCategories]
  );

  useEffect(() => {
    if (activeTab.type === "SET") return;
    if (visibleCategories.some((category) => category.id === activeTab.categoryId)) return;
    setActiveTab(SET_TAB);
  }, [activeTab, visibleCategories]);

  const productFilters = useMemo(
    () =>
      activeTab.type === "SET"
        ? { orderType: customerOrderType, section: "SET" as const }
        : {
            orderType: customerOrderType,
            section: "MENU" as const,
            categoryId: activeTab.categoryId,
          },
    [activeTab, customerOrderType]
  );

  const {
    data: products = [],
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery({
    queryKey: ["customer-sale-products", productFilters],
    queryFn: () => customerSaleProductApi.list(productFilters),
  });

  const {
    data: acceptedOrders = [],
    isLoading: activeOrdersLoading,
  } = useQuery({
    queryKey: ["customer-active-orders", tableName],
    queryFn: () => orderApi.getActiveCustomerOrders(tableName),
    enabled: tableName.trim().length > 0,
    refetchInterval: 5000,
  });

  const {
    data: canceledOrders = [],
  } = useQuery({
    queryKey: ["customer-canceled-orders", tableName],
    queryFn: () => orderApi.getCanceledCustomerOrders(tableName),
    enabled: tableName.trim().length > 0,
    refetchInterval: 5000,
  });

  const {
    data: activeStaffCalls = [],
  } = useQuery({
    queryKey: ["customer-active-staff-calls", tableName],
    queryFn: () => staffCallApi.getActiveCustomerCalls(tableName),
    enabled: tableName.trim().length > 0,
    refetchInterval: 3000,
  });

  const cartItems = useMemo(
    () => Object.values(cart).sort((a, b) => a.name.localeCompare(b.name, "ko-KR")),
    [cart]
  );
  const visibleCancelNotices = useMemo(() => {
    const seen = new Set<number>();
    const fromEvents = cancelNotices.filter((notice) => {
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
      .map((order): CancelNotice => ({
        key: `order-${order.id}`,
        orderId: order.id,
        orderNo: order.orderNo,
        message: order.cancelMessage ?? "주문이 취소되었습니다.",
        receivedAt: new Date(order.updatedAt),
      }));
    return [...fromEvents, ...fromOrders].slice(0, 10);
  }, [cancelNotices, canceledOrders, dismissedCanceledOrderIds]);
  const billableOrders = useMemo(
    () => acceptedOrders.filter((order) => order.status !== "CANCELED"),
    [acceptedOrders]
  );

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const acceptedQuantity = billableOrders.reduce(
    (orderSum, order) =>
      orderSum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );
  const acceptedTotalPrice = billableOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );
  const displayQuantity = acceptedQuantity + totalQuantity;
  const displayTotalPrice = acceptedTotalPrice + totalPrice;

  const orderTypeLabel = useMemo(
    () => (orderType === "dine-in" ? "매장 식사" : "포장 주문"),
    [orderType]
  );

  const createOrderMutation = useMutation({
    mutationFn: orderApi.createCustomerOrder,
    onSuccess: (order) => {
      setOrderConfirmOpen(false);
      setCart({});
      setCompletedOrder(order);
      queryClient.invalidateQueries({ queryKey: ["customer-active-orders", tableName] });
    },
    onError: (e) => {
      setOrderConfirmOpen(false);
      toastError(e, "주문을 접수하지 못했습니다. 메뉴 상태를 확인한 뒤 다시 시도해주세요.");
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: number) => orderApi.cancelCustomerOrder(orderId, tableName),
    onSuccess: (order) => {
      if (completedOrder?.id === order.id) {
        setCompletedOrder(null);
      }
      setCanceledOrder(order);
      queryClient.invalidateQueries({ queryKey: ["customer-active-orders", tableName] });
      queryClient.invalidateQueries({ queryKey: ["customer-canceled-orders", tableName] });
    },
    onError: (e) => {
      toastError(e, "주문을 취소하지 못했습니다. 직원에게 문의해주세요.");
    },
  });

  const acknowledgeCanceledOrdersMutation = useMutation({
    mutationFn: () => orderApi.acknowledgeCustomerCanceledOrders(tableName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-canceled-orders", tableName] });
      setCancelNotices([]);
      setActiveCancelNotice(null);
    },
    onError: (e) => {
      toastError(e, "취소 안내 확인 처리를 하지 못했습니다.");
    },
  });

  const createStaffCallMutation = useMutation({
    mutationFn: () => {
      const quickRequests = [...basicRequestSelected];
      const customMessage = staffCallMessage.trim();
      const messageParts = [...quickRequests, customMessage].filter(Boolean);
      return staffCallApi.createCustomerCall({
        tableName,
        type: quickRequests.length > 0 ? "REFILL" : staffCallType,
        message: messageParts.length > 0 ? messageParts.join(", ") : null,
      });
    },
    onSuccess: () => {
      setStaffCallDialogOpen(false);
      setStaffCallMessage("");
      setStaffCallType("GENERAL");
      setBasicRequestSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["customer-active-staff-calls", tableName] });
      queryClient.refetchQueries({ queryKey: ["customer-active-staff-calls", tableName], type: "active" });
      toast.success("요청을 전달했습니다.");
    },
    onError: (e) => {
      toastError(e, "요청을 전달하지 못했습니다.");
    },
  });

  const cancelStaffCallMutation = useMutation({
    mutationFn: (callId: number) => staffCallApi.cancelCustomerCall(callId, { tableName }),
    onMutate: async (callId) => {
      await queryClient.cancelQueries({ queryKey: ["customer-active-staff-calls", tableName] });
      const previousCalls =
        queryClient.getQueryData<StaffCall[]>(["customer-active-staff-calls", tableName]) ?? [];
      queryClient.setQueryData<StaffCall[]>(
        ["customer-active-staff-calls", tableName],
        (current) => current?.filter((call) => call.id !== callId) ?? [],
      );
      return { previousCalls };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-active-staff-calls", tableName] });
      queryClient.refetchQueries({ queryKey: ["customer-active-staff-calls", tableName], type: "active" });
      toast.success("호출을 취소했습니다.");
    },
    onError: (e, _callId, context) => {
      if (context?.previousCalls) {
        queryClient.setQueryData(["customer-active-staff-calls", tableName], context.previousCalls);
      }
      toastError(e, "호출을 취소하지 못했습니다.");
    },
  });

  const acknowledgeVisibleCancelNotices = () => {
    setDismissedCanceledOrderIds((current) => {
      const next = new Set(current);
      visibleCancelNotices.forEach((notice) => {
        if (notice.orderId != null) {
          next.add(notice.orderId);
        }
      });
      return next;
    });
    setCancelNotices([]);
    setCancelNoticesOpen(false);
    if (tableName.trim()) {
      acknowledgeCanceledOrdersMutation.mutate();
    }
  };

  const requestSubmitOrder = () => {
    if (createOrderMutation.isPending) return;
    if (cartItems.length === 0) {
        if (billableOrders.length > 0) {
        document.getElementById("kiosk-menu-list")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
      return;
    }
    if (!tableName.trim()) {
      toast.error("테이블명을 먼저 설정해주세요.");
      return;
    }

    setOrderConfirmOpen(true);
  };

  const openStaffCallDialog = () => {
    if (!tableName.trim()) {
      toast.error("테이블명이 설정되어야 호출할 수 있습니다.");
      return;
    }
    setStaffCallDialogOpen(true);
  };

  const submitOrder = () => {
    if (cartItems.length === 0 || createOrderMutation.isPending) return;

    createOrderMutation.mutate({
      tableName,
      orderType: customerOrderType,
      items: cartItems.map((item) => ({
        type: item.type,
        id: item.id,
        quantity: item.quantity,
      })),
    });
  };

  const updateQuantity = (product: CustomerSaleProduct, delta: number) => {
    if (delta > 0 && product.status === "SOLD_OUT") return;
    if (completedOrder) setCompletedOrder(null);

    setCart((current) => {
      const key = toCartKey(product.type, product.id);
      const previous = current[key];
      const nextQuantity = Math.max(0, (previous?.quantity ?? 0) + delta);
      const next = { ...current };

      if (nextQuantity === 0) {
        delete next[key];
      } else {
        next[key] = {
          key,
          type: product.type,
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: nextQuantity,
          components: product.components,
        };
      }

      return next;
    });
  };

  const toggleProductSelection = (product: CustomerSaleProduct) => {
    if (completedOrder) setCompletedOrder(null);

    setCart((current) => {
      const key = toCartKey(product.type, product.id);
      const next = { ...current };

      if (current[key]) {
        delete next[key];
        return next;
      }

      if (product.status === "SOLD_OUT") {
        return current;
      }

      next[key] = {
        key,
        type: product.type,
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        components: product.components,
      };
      return next;
    });
  };

  const updateCartItemQuantity = (item: CartItem, delta: number) => {
    if (completedOrder) setCompletedOrder(null);

    setCart((current) => {
      const nextQuantity = Math.max(0, (current[item.key]?.quantity ?? 0) + delta);
      const next = { ...current };
      if (nextQuantity === 0) delete next[item.key];
      else next[item.key] = { ...item, quantity: nextQuantity };
      return next;
    });
  };

  const isLoading = categoriesLoading || productsLoading;
  const isError = categoriesError || productsError;

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-zinc-50 px-4 py-4">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1fr_360px]">
        <section className="min-w-0 space-y-4">
          <div className="flex flex-col gap-4 rounded-lg border border-zinc-300 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Utensils className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">키오스크 주문</h1>
                <p className="text-sm text-muted-foreground">
                  {tableName || "테이블명 미설정"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:w-[360px]">
              <OrderTypeButton
                active={orderType === "dine-in"}
                icon={Store}
                label="매장"
                onClick={() => setOrderType("dine-in")}
              />
              <OrderTypeButton
                active={orderType === "takeout"}
                icon={Package}
                label="포장"
                onClick={() => setOrderType("takeout")}
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {tabs.map((tab) => {
              const active =
                activeTab.type === tab.type &&
                (tab.type === "SET" ||
                  (activeTab.type === "MENU" && activeTab.categoryId === tab.categoryId));

              return (
                <button
                  key={tab.type === "SET" ? "SET" : `MENU:${tab.categoryId}`}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`h-12 rounded-md border px-3 text-sm font-semibold transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-zinc-300 bg-white text-foreground hover:bg-zinc-50"
                  }`}
                >
                  <span className="line-clamp-1">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <StatePanel message="메뉴를 불러오는 중입니다." />
          ) : isError ? (
            <StatePanel message="메뉴를 불러오지 못했습니다." tone="error" />
          ) : products.length === 0 ? (
            <StatePanel
              message={
                activeTab.type === "SET"
                  ? "등록된 세트 메뉴가 없습니다."
                  : "표시할 메뉴가 없습니다."
              }
            />
          ) : (
            <div id="kiosk-menu-list" className="grid scroll-mt-24 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => {
                const key = toCartKey(product.type, product.id);
                return (
                  <MenuCard
                    key={key}
                    product={product}
                    quantity={cart[key]?.quantity ?? 0}
                    onMinus={() => updateQuantity(product, -1)}
                    onPlus={() => updateQuantity(product, 1)}
                    onToggle={() => toggleProductSelection(product)}
                  />
                );
              })}
            </div>
          )}
        </section>

        <aside className="lg:sticky lg:top-[4.5rem] lg:self-start">
          <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-300 bg-zinc-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">주문 내역</h2>
              </div>
              <div className="flex items-center gap-2">
                {visibleCancelNotices.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setCancelNoticesOpen(true)}
                    className="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-100"
                  >
                    취소({visibleCancelNotices.length})
                  </button>
                ) : null}
                <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                  {orderTypeLabel}
                </span>
              </div>
            </div>

            <>
                <div className="divide-y divide-border">
                  {acceptedOrders.length > 0 && (
                    <AcceptedOrdersSummary
                      orders={acceptedOrders}
                      cancelingOrderId={cancelOrderMutation.variables ?? null}
                      onCancelOrder={(orderId) => cancelOrderMutation.mutate(orderId)}
                    />
                  )}
                  {cartItems.length === 0 ? (
                    acceptedOrders.length === 0 && (
                      <div className="flex h-44 items-center justify-center bg-zinc-50 text-sm text-muted-foreground">
                        {activeOrdersLoading ? "주문 내역을 불러오는 중입니다" : "선택한 메뉴가 없습니다"}
                      </div>
                    )
                  ) : (
                    <section className="bg-white">
                      <div className="flex items-center justify-between bg-zinc-50 px-4 py-3">
                        <p className="text-sm font-bold">
                          {billableOrders.length > 0 ? "추가 주문" : "선택한 메뉴"}
                        </p>
                        <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                          {totalQuantity}개
                        </span>
                      </div>
                      <div className="divide-y divide-zinc-200 border-t border-zinc-300">
                        {cartItems.map((item) => (
                          <div key={item.key} className="bg-background px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatPrice(item.price)}원
                                </p>
                              </div>
                              <span className="shrink-0 text-sm font-bold">
                                {formatPrice(item.price * item.quantity)}원
                              </span>
                            </div>
                            {item.type === "SALE_MENU_SET" && item.components.length > 0 && (
                              <div className="mt-2 space-y-1 rounded-md bg-muted/50 p-2">
                                {item.components.map((component) => (
                                  <div
                                    key={`${item.key}:${component.name}:${component.quantity}`}
                                    className="flex min-h-5 items-center justify-between gap-2 text-xs"
                                  >
                                    <span className="min-w-0 truncate text-muted-foreground">
                                      {component.name}
                                    </span>
                                    <span className="shrink-0 font-semibold text-foreground">
                                      x{component.quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="mt-3 flex items-center justify-end gap-2">
                              <QuantityButton
                                label="감소"
                                onClick={() => updateCartItemQuantity(item, -1)}
                              >
                                <Minus className="h-4 w-4" />
                              </QuantityButton>
                              <span className="flex h-8 w-9 items-center justify-center rounded-md bg-muted text-sm font-bold">
                                {item.quantity}
                              </span>
                              <QuantityButton
                                label="증가"
                                onClick={() => updateCartItemQuantity(item, 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </QuantityButton>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                <div className="space-y-3 border-t border-zinc-300 bg-zinc-50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">수량</span>
                    <span className="font-semibold">{displayQuantity}개</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      총 금액
                    </span>
                    <span className="text-2xl font-bold">{formatPrice(displayTotalPrice)}원</span>
                  </div>

                  <button
                    type="button"
                    onClick={requestSubmitOrder}
                    disabled={(totalQuantity === 0 && billableOrders.length === 0) || createOrderMutation.isPending || !tableName.trim()}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ReceiptText className="h-4 w-4" />
                    {createOrderMutation.isPending
                      ? "접수 중"
                      : billableOrders.length > 0 && totalQuantity === 0
                        ? "추가 메뉴를 선택해주세요"
                        : billableOrders.length > 0
                        ? "추가 주문 접수하기"
                        : "주문 접수하기"}
                  </button>

                  <div className="rounded-md border border-dashed border-border bg-background p-3">
                    <p className="text-sm font-semibold">후불 결제 안내</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      식사 후 데스크에서 {tableName ? `${tableName} ` : ""}주문 내역으로 결제해주세요.
                    </p>
                  </div>

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
                            canceling={
                              cancelStaffCallMutation.isPending &&
                              cancelStaffCallMutation.variables === call.id
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={openStaffCallDialog}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-background text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <Phone className="h-4 w-4" />
                    직원 호출
                    {activeStaffCalls.length > 0 ? (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
                        {activeStaffCalls.length}
                      </span>
                    ) : null}
                  </button>
                </div>
            </>
          </div>
        </aside>
      </div>
      <ConfirmDialog
        open={orderConfirmOpen}
        title={billableOrders.length > 0 ? "추가 주문을 접수할까요?" : "주문을 접수할까요?"}
        description="접수 후 주방에 주문 요청이 전달됩니다."
        confirmText={createOrderMutation.isPending ? "접수 중" : "주문 접수"}
        cancelText="다시 확인"
        loading={createOrderMutation.isPending}
        onCancel={() => setOrderConfirmOpen(false)}
        onConfirm={submitOrder}
      >
        <OrderConfirmSummary
          tableName={tableName}
          orderTypeLabel={orderTypeLabel}
          items={cartItems}
          totalQuantity={totalQuantity}
          totalPrice={totalPrice}
        />
      </ConfirmDialog>
      <NoticeDialog
        open={!!completedOrder}
        title="주문이 접수되었습니다"
        tone="success"
        confirmText="확인"
        onConfirm={() => setCompletedOrder(null)}
      >
        {completedOrder && (
          <OrderNoticeSummary order={completedOrder} tableName={tableName} />
        )}
      </NoticeDialog>
      <NoticeDialog
        open={!!canceledOrder}
        title="주문이 취소되었습니다"
        tone="info"
        confirmText="확인"
        onConfirm={() => {
          setCanceledOrder(null);
          if (tableName.trim()) {
            acknowledgeCanceledOrdersMutation.mutate();
          }
        }}
      >
        {canceledOrder && (
          <CanceledOrderSummary order={canceledOrder} tableName={tableName} />
        )}
      </NoticeDialog>
      <NoticeDialog
        open={cancelNoticesOpen}
        title="취소 안내"
        tone="error"
        confirmText="확인"
        onConfirm={acknowledgeVisibleCancelNotices}
      >
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            취소된 주문입니다.
          </p>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {visibleCancelNotices.map((notice) => (
              <div
                key={notice.key}
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-red-700">
                  <span className="min-w-0 truncate">
                    {notice.orderNo ? `주문번호: ${notice.orderNo}` : "취소된 주문"}
                  </span>
                  <span className="shrink-0">
                    {formatTime(notice.receivedAt.toISOString())}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-red-800">{notice.message}</p>
              </div>
            ))}
          </div>
        </div>
      </NoticeDialog>
      <NoticeDialog
        open={!!activeCancelNotice}
        title="주문이 취소되었습니다"
        tone="error"
        confirmText="확인"
        onConfirm={() => setActiveCancelNotice(null)}
      >
        {activeCancelNotice ? (
          <div className="space-y-3">
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
              <div className="flex items-center justify-between gap-2 text-xs font-semibold text-red-700">
                <span className="min-w-0 truncate">
                  {activeCancelNotice.orderNo
                    ? `주문번호: ${activeCancelNotice.orderNo}`
                    : "취소된 주문"}
                </span>
                <span className="shrink-0">
                  {formatTime(activeCancelNotice.receivedAt.toISOString())}
                </span>
              </div>
              <p className="mt-2 text-base font-black text-red-800">
                {activeCancelNotice.message}
              </p>
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              이 안내는 취소 버튼에서 다시 확인할 수 있습니다.
            </p>
          </div>
        ) : null}
      </NoticeDialog>
      {staffCallDialogOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
        >
          <div className="w-full max-w-3xl rounded-lg border border-border bg-background p-5 shadow-xl">
            <h2 className="text-lg font-black">직원 호출</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tableName ? `${tableName}에서 직원을 호출합니다.` : "테이블명이 필요합니다."}
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <section className="rounded-md border border-border bg-muted/30 p-4">
                <h3 className="text-sm font-black">기본 요청</h3>
                <div className="mt-3 flex flex-col gap-2">
                  {(["물", "냅킨", "앞접시", "그릇 치워주세요"] as const).map((item) => {
                    const checked = basicRequestSelected.has(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setBasicRequestSelected((prev) => {
                            const next = new Set(prev);
                            if (next.has(item)) next.delete(item);
                            else next.add(item);
                            return next;
                          });
                        }}
                        className={cn(
                          "flex h-11 items-center gap-3 rounded-md border bg-background px-3 text-left text-sm font-bold transition-colors",
                          checked
                            ? "border-primary text-primary"
                            : "border-border hover:bg-accent",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                            checked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background",
                          )}
                        >
                          {checked ? <Check className="h-3 w-3" /> : null}
                        </span>
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-md border border-border bg-background p-4">
                <h3 className="text-sm font-black">직원 호출</h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(["GENERAL", "REFILL", "QUESTION", "PAYMENT", "OTHER"] as StaffCallType[]).map((type) => {
                    const selected = staffCallType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setStaffCallType(type)}
                        className={cn(
                          "h-11 rounded-md border text-sm font-bold transition-colors",
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
                  onChange={(event) => setStaffCallMessage(event.target.value)}
                  rows={4}
                  maxLength={200}
                  placeholder={
                    staffCallType === "OTHER" && basicRequestSelected.size === 0
                      ? "필요한 도움을 입력해주세요. (필수)"
                      : "추가 메시지를 입력해주세요. (선택)"
                  }
                  className="mt-3 w-full resize-none rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                />
              </section>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={createStaffCallMutation.isPending}
                onClick={() => {
                  setStaffCallDialogOpen(false);
                  setStaffCallMessage("");
                  setStaffCallType("GENERAL");
                  setBasicRequestSelected(new Set());
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
                  (
                    basicRequestSelected.size === 0 &&
                    staffCallType === "OTHER" &&
                    !staffCallMessage.trim()
                  )
                }
                onClick={() => createStaffCallMutation.mutate()}
                className="h-10 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createStaffCallMutation.isPending ? "요청 중" : "요청하기"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

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
  const elapsedLabel =
    elapsedSec < 60 ? `${elapsedSec}초 전` : `${Math.floor(elapsedSec / 60)}분 전`;

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

function OrderNoticeSummary({ order, tableName }: { order: Order; tableName: string }) {
  return (
    <OrderResultSummary
      order={order}
      tableName={tableName}
      statusLabel={orderStatusLabel[order.status]}
      amountLabel="주문 금액"
      amountClassName="bg-emerald-50 text-emerald-700"
    />
  );
}

function OrderConfirmSummary({
  tableName,
  orderTypeLabel,
  items,
  totalQuantity,
  totalPrice,
}: {
  tableName: string;
  orderTypeLabel: string;
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs">
        <div>
          <p className="text-muted-foreground">테이블</p>
          <p className="mt-1 font-bold text-foreground">{tableName || "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">주문 유형</p>
          <p className="mt-1 font-bold text-foreground">{orderTypeLabel}</p>
        </div>
        <div>
          <p className="text-muted-foreground">수량</p>
          <p className="mt-1 font-bold text-foreground">{totalQuantity}개</p>
        </div>
        <div>
          <p className="text-muted-foreground">금액</p>
          <p className="mt-1 font-bold text-foreground">{formatPrice(totalPrice)}원</p>
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto rounded-md border border-border">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-start justify-between gap-3 border-b border-border px-3 py-2 last:border-b-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatPrice(item.price)}원 x {item.quantity}
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold text-foreground">
              {formatPrice(item.price * item.quantity)}원
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CanceledOrderSummary({ order, tableName }: { order: Order; tableName: string }) {
  return (
    <OrderResultSummary
      order={order}
      tableName={tableName}
      statusLabel="취소"
      amountLabel="취소 금액"
      amountClassName="bg-red-50 text-red-700"
    />
  );
}

function OrderResultSummary({
  order,
  tableName,
  statusLabel,
  amountLabel,
  amountClassName,
}: {
  order: Order;
  tableName: string;
  statusLabel: string;
  amountLabel: string;
  amountClassName: string;
}) {
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs">
        <div>
          <p className="text-muted-foreground">주문번호</p>
          <p className="mt-1 break-all font-bold text-foreground">{order.orderNo}</p>
        </div>
        <div>
          <p className="text-muted-foreground">테이블</p>
          <p className="mt-1 font-bold text-foreground">{tableName || "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">상태</p>
          <p className="mt-1 font-bold text-foreground">{statusLabel}</p>
        </div>
        <div>
          <p className="text-muted-foreground">수량</p>
          <p className="mt-1 font-bold text-foreground">{totalQuantity}개</p>
        </div>
      </div>

      <div className="rounded-md border border-border">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-3 border-b border-border px-3 py-2 last:border-b-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatPrice(item.unitPrice)}원 x {item.quantity}
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold text-foreground">
              {formatPrice(item.lineTotal)}원
            </p>
          </div>
        ))}
      </div>

      <div className={`flex items-center justify-between rounded-md px-3 py-2 ${amountClassName}`}>
        <span className="text-sm font-bold">{amountLabel}</span>
        <span className="text-lg font-black">
          {formatPrice(order.totalAmount)}원
        </span>
      </div>
      {order.status === "CANCELED" && order.cancelMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs font-bold text-red-700">취소 안내</p>
          <p className="mt-1 text-sm font-semibold text-red-800">{order.cancelMessage}</p>
        </div>
      ) : null}
    </div>
  );
}

function AcceptedOrdersSummary({
  orders,
  cancelingOrderId,
  onCancelOrder,
}: {
  orders: Order[];
  cancelingOrderId: number | null;
  onCancelOrder: (orderId: number) => void;
}) {
  return (
    <section className="space-y-3 bg-muted/20 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold">접수된 주문</p>
        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
          {orders.length}건
        </span>
      </div>
      <div className="space-y-2">
        {orders.map((order) => (
            <div
              key={order.id}
              className={`rounded-md border p-2 pl-3 ${orderStatusCardClass[order.status]}`}
            >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs font-semibold text-muted-foreground">
                주문번호: {order.orderNo}
              </p>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="space-y-2 rounded-md bg-muted/20 p-2">
              {order.items.map((item) => (
                <OrderHistoryItem key={item.id} item={item} compact />
              ))}
            </div>
            {order.status === "RECEIVED" && (
              <button
                type="button"
                onClick={() => onCancelOrder(order.id)}
                disabled={cancelingOrderId === order.id}
                className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-md border border-red-500/30 bg-background text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                {cancelingOrderId === order.id ? "취소 중" : "주문 취소"}
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function OrderHistoryItem({
  item,
  compact = false,
}: {
  item: Order["items"][number];
  compact?: boolean;
}) {
  return (
    <div className={compact ? "rounded-md bg-muted/30 p-2" : ""}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatPrice(item.unitPrice)}원 x {item.quantity}
          </p>
        </div>
        <span className="shrink-0 text-sm font-bold">
          {formatPrice(item.lineTotal)}원
        </span>
      </div>
      {item.type === "SALE_MENU_SET" && item.components.length > 0 && (
        <div className="mt-2 space-y-1 rounded-md bg-muted/50 p-2">
          {item.components.map((component) => (
            <div
              key={`${item.id}:${component.name}:${component.quantity}`}
              className="flex min-h-5 items-center justify-between gap-2 text-xs"
            >
              <span className="min-w-0 truncate text-muted-foreground">
                {component.name}
              </span>
              <span className="shrink-0 font-semibold text-foreground">
                x{component.quantity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderTypeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-14 items-center justify-center gap-2 rounded-md border text-base font-bold transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-accent"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function MenuCard({
  product,
  quantity,
  onMinus,
  onPlus,
  onToggle,
}: {
  product: CustomerSaleProduct;
  quantity: number;
  onMinus: () => void;
  onPlus: () => void;
  onToggle: () => void;
}) {
  const soldOut = product.status === "SOLD_OUT";
  const isSet = product.type === "SALE_MENU_SET";
  const visibleComponents = product.components.slice(0, 4);
  const hiddenComponentCount = Math.max(0, product.components.length - visibleComponents.length);
  const canToggle = !soldOut || quantity > 0;

  return (
    <div className="relative">
      {quantity > 0 && (
        <div className="absolute -right-2.5 -top-2.5 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 shadow-md">
          <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
        </div>
      )}
    <article
      aria-label={quantity > 0 ? `${product.name} 선택 취소` : `${product.name} 담기`}
      className={`relative overflow-hidden rounded-lg border bg-white transition-colors ${
        !canToggle
          ? "opacity-75"
          : "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      } ${
        quantity > 0
          ? "border-zinc-900 shadow-sm"
          : "border-zinc-300 hover:border-zinc-600"
      }`}
      onClick={canToggle ? onToggle : undefined}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (canToggle) onToggle();
      }}
      role="button"
      tabIndex={canToggle ? 0 : -1}
    >
      {quantity > 0 && (
        <div className="pointer-events-none absolute inset-0 z-20 rounded-lg ring-2 ring-inset ring-zinc-950" />
      )}
      <div className="relative h-28 overflow-hidden bg-zinc-100">
        {product.imageUrl ? (
          <div
            aria-label={product.name}
            className="h-full w-full bg-cover bg-center"
            role="img"
            style={{ backgroundImage: `url(${product.imageUrl})` }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
        {soldOut && (
          <span className="absolute right-3 top-3 rounded-md bg-background/95 px-2 py-1 text-xs font-bold text-destructive shadow-sm">
            품절
          </span>
        )}
      </div>
      <div className="space-y-4 p-4">
        <div className="min-h-28">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 text-lg font-bold tracking-tight">{product.name}</h3>
            {isSet && (
              <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-muted-foreground">
                세트
              </span>
            )}
          </div>
          {isSet ? (
            <div className="mt-2 space-y-2">
              {product.description && (
                <p className="line-clamp-1 text-sm text-muted-foreground">
                  {product.description}
                </p>
              )}
              {product.components.length > 0 ? (
                <div className="space-y-1 rounded-md bg-zinc-50 p-2">
                  {visibleComponents.map((component) => (
                    <div
                      key={`${component.name}:${component.quantity}`}
                      className="flex min-h-6 items-center justify-between gap-2 text-xs"
                    >
                      <span className="min-w-0 truncate font-semibold text-foreground">
                        {component.name}
                      </span>
                      <span className="shrink-0 rounded bg-white px-1.5 py-0.5 font-bold text-muted-foreground">
                        x{component.quantity}
                      </span>
                    </div>
                  ))}
                  {hiddenComponentCount > 0 && (
                    <div className="text-xs font-semibold text-muted-foreground">
                      외 {hiddenComponentCount}개
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">세트 구성 정보가 없습니다.</p>
              )}
            </div>
          ) : (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {product.description || "메뉴 설명이 없습니다."}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xl font-bold">{formatPrice(product.price)}원</span>
          <div className="flex items-center gap-2">
            {quantity > 0 && (
              <>
                <QuantityButton label="감소" onClick={onMinus}>
                  <Minus className="h-4 w-4" />
                </QuantityButton>
                <span className="flex h-9 w-10 items-center justify-center rounded-md bg-zinc-100 text-sm font-bold">
                  {quantity}
                </span>
              </>
            )}
            <QuantityButton label="추가" onClick={onPlus} primary disabled={soldOut}>
              <Plus className="h-4 w-4" />
            </QuantityButton>
          </div>
        </div>
      </div>
    </article>
    </div>
  );
}

function QuantityButton({
  label,
  onClick,
  primary = false,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        primary
          ? "border-primary bg-primary text-primary-foreground hover:opacity-90"
          : "border-border bg-background text-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function StatePanel({
  message,
  tone = "muted",
}: {
  message: string;
  tone?: "muted" | "error";
}) {
  return (
    <div
      className={`flex min-h-64 items-center justify-center rounded-lg border border-border bg-background p-6 text-sm ${
        tone === "error" ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      {message}
    </div>
  );
}
