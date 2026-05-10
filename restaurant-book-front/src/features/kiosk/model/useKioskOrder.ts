import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customerSaleProductApi } from "@/entities/customer-sale-product/api/customerSaleProductApi";
import type { CustomerOrderType, CustomerSaleProduct } from "@/entities/customer-sale-product/model/types";
import { orderApi } from "@/entities/order/api/orderApi";
import { useCustomerOrdersWebSocket } from "@/entities/order/api/orderRealtime";
import type { Order } from "@/entities/order/model/types";
import { customerPaymentApi } from "@/entities/payment/api/customerPaymentApi";
import { saleMenuCategoryApi } from "@/entities/sale-menu-category/api/saleMenuCategoryApi";
import { siteSettingApi } from "@/entities/site-setting/api/siteSettingApi";
import { staffCallApi } from "@/entities/staff-call/api/staffCallApi";
import { useCustomerStaffCallsWebSocket } from "@/entities/staff-call/api/staffCallRealtime";
import type { StaffCall, StaffCallType } from "@/entities/staff-call/model/types";
import { useAuth } from "@/entities/user/model/authStore";
import { toast, toastError } from "@/shared/lib/toast";
import { tableSessionStorage } from "@/shared/lib/tableSessionStorage";
import { loadTossPayments } from "@/shared/lib/tossPayments";
import { toCancelNoticeItems, mergeCancelNoticeOrder, playCancelAlertSound } from "../lib/cancelNotice";
import { toCartKey } from "../lib/cart";
import { getOrderQuantity } from "../lib/order";
import { ALL_TAB, CUSTOMER_ORDER_REFETCH_INTERVAL_MS, getPaymentGuideCopy, SET_TAB, TOSS_PAYMENT_META_KEY_PREFIX } from "./constants";
import type { CartItem, CartItemKey, CancelNotice, KioskOrderType, KioskTab, PaymentSelectionMode } from "./types";

const toCustomerOrderType = (orderType: KioskOrderType): CustomerOrderType =>
  orderType === "dine-in" ? "DINE_IN" : "TAKEOUT";

export function useKioskOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [orderType, setOrderType] = useState<KioskOrderType>("dine-in");
  const [activeTab, setActiveTab] = useState<KioskTab>({ type: "MENU", categoryId: -1, label: "" });
  const [cart, setCart] = useState<Record<CartItemKey, CartItem>>({});
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [canceledOrder, setCanceledOrder] = useState<Order | null>(null);
  const [cancelNotices, setCancelNotices] = useState<CancelNotice[]>([]);
  const [dismissedCanceledOrderIds, setDismissedCanceledOrderIds] = useState<Set<number>>(() => new Set());
  const [cancelNoticesOpen, setCancelNoticesOpen] = useState(false);
  const [orderConfirmOpen, setOrderConfirmOpen] = useState(false);
  const [tableName, setTableName] = useState("");
  const [staffCallDialogOpen, setStaffCallDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentSelectionMode, setPaymentSelectionMode] = useState<PaymentSelectionMode | null>(null);
  const [selectedPaymentOrderIds, setSelectedPaymentOrderIds] = useState<Set<number>>(new Set());
  const [paymentLaunching, setPaymentLaunching] = useState(false);
  const [staffCallType, setStaffCallType] = useState<StaffCallType>("GENERAL");
  const [staffCallMessage, setStaffCallMessage] = useState("");
  const [basicRequestSelected, setBasicRequestSelected] = useState<Set<string>>(new Set());
  const [settingsPasswordOpen, setSettingsPasswordOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPassword, setSettingsPassword] = useState("");
  const [settingsPasswordError, setSettingsPasswordError] = useState("");
  const [draftHeaderNavVisible, setDraftHeaderNavVisible] = useState(true);

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
      items: canceled ? toCancelNoticeItems(canceled) : [],
      totalAmount: canceled?.totalAmount ?? null,
      totalQuantity: canceled ? getOrderQuantity(canceled) : null,
    };
    setCancelNotices((current) => [
      notice,
      ...current,
    ].slice(0, 10));
    playCancelAlertSound();
    toast.error("주문이 취소되었습니다.", {
      description: `${message} · 취소 버튼에서 다시 확인할 수 있습니다.`,
      duration: 10000,
      position: "top-center",
    });
  });
  useCustomerStaffCallsWebSocket(tableName, tableName.trim().length > 0, (payload) => {
    if (payload.reason === "ACKNOWLEDGED") {
      toast.success("직원이 호출을 확인했습니다.");
    }
  });

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
      ...visibleCategories.map((category) => ({
        type: "MENU" as const,
        categoryId: category.id,
        label: category.name,
      })),
      SET_TAB,
      ALL_TAB,
    ],
    [visibleCategories]
  );

  useEffect(() => {
    if (categoriesLoading) return;
    if (activeTab.type === "ALL") return;
    if (activeTab.type === "SET") return;
    if (visibleCategories.some((category) => category.id === activeTab.categoryId)) return;
    if (visibleCategories.length > 0) {
      setActiveTab({ type: "MENU", categoryId: visibleCategories[0].id, label: visibleCategories[0].name });
    } else {
      setActiveTab(SET_TAB);
    }
  }, [activeTab, visibleCategories, categoriesLoading]);

  const productFilters = useMemo(
    () =>
      activeTab.type === "SET"
        ? { orderType: customerOrderType, section: "SET" as const }
        : activeTab.type === "ALL"
          ? { orderType: customerOrderType, section: "ALL" as const }
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

  const displayProducts = useMemo(() => {
    if (activeTab.type !== "ALL") return products;

    const categoryOrderMap = new Map(
      visibleCategories.map((category, index) => [category.id, index]),
    );
    return [...products].sort((a, b) => {
      const aSectionOrder =
        a.type === "SALE_MENU_SET" ? 999999 : categoryOrderMap.get(a.category?.id ?? -1) ?? 999998;
      const bSectionOrder =
        b.type === "SALE_MENU_SET" ? 999999 : categoryOrderMap.get(b.category?.id ?? -1) ?? 999998;
      return aSectionOrder - bSectionOrder || a.displayOrder - b.displayOrder || a.id - b.id;
    });
  }, [activeTab.type, products, visibleCategories]);

  const {
    data: acceptedOrders = [],
    isLoading: activeOrdersLoading,
  } = useQuery({
    queryKey: ["customer-active-orders", tableName],
    queryFn: () => orderApi.getActiveCustomerOrders(tableName),
    enabled: tableName.trim().length > 0,
    refetchInterval: CUSTOMER_ORDER_REFETCH_INTERVAL_MS,
  });

  const {
    data: canceledOrders = [],
  } = useQuery({
    queryKey: ["customer-canceled-orders", tableName],
    queryFn: () => orderApi.getCanceledCustomerOrders(tableName),
    enabled: tableName.trim().length > 0,
    refetchInterval: CUSTOMER_ORDER_REFETCH_INTERVAL_MS,
  });

  const {
    data: activeStaffCalls = [],
  } = useQuery({
    queryKey: ["customer-active-staff-calls", tableName],
    queryFn: () => staffCallApi.getActiveCustomerCalls(tableName),
    enabled: tableName.trim().length > 0,
    refetchInterval: 20000,
  });

  const tossPaymentConfigQuery = useQuery({
    queryKey: ["customer-toss-payment-config"],
    queryFn: () => customerPaymentApi.getTossPaymentConfig(),
    staleTime: 1000 * 60 * 10,
    retry: false,
  });

  const {
    data: siteSetting,
  } = useQuery({
    queryKey: ["site-settings"],
    queryFn: siteSettingApi.get,
    staleTime: 1000 * 10,
  });

  const cartItems = useMemo(
    () => Object.values(cart).sort((a, b) => a.name.localeCompare(b.name, "ko-KR")),
    [cart]
  );
  const visibleCancelNotices = useMemo(() => {
    const seen = new Set<number>();
    const canceledOrderById = new Map(canceledOrders.map((order) => [order.id, order]));
    const fromEvents = cancelNotices.map((notice) => {
      if (notice.orderId == null) {
        return notice;
      }
      const order = canceledOrderById.get(notice.orderId);
      return order ? mergeCancelNoticeOrder(notice, order) : notice;
    }).filter((notice) => {
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
        items: toCancelNoticeItems(order),
        totalAmount: order.totalAmount,
        totalQuantity: getOrderQuantity(order),
      }));
    return [...fromEvents, ...fromOrders].slice(0, 10);
  }, [cancelNotices, canceledOrders, dismissedCanceledOrderIds]);
  const billableOrders = useMemo(
    () => acceptedOrders.filter((order) => order.status !== "CANCELED"),
    [acceptedOrders]
  );
  const payableOrders = useMemo(
    () => acceptedOrders.filter((order) => order.status === "READY"),
    [acceptedOrders]
  );
  const selectedPaymentOrders = useMemo(
    () => payableOrders.filter((order) => selectedPaymentOrderIds.has(order.id)),
    [payableOrders, selectedPaymentOrderIds]
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
  const selectedPaymentTotalPrice = selectedPaymentOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );
  const displayQuantity = acceptedQuantity + totalQuantity;
  const displayTotalPrice = acceptedTotalPrice + totalPrice;
  const paymentGuideCopy = getPaymentGuideCopy(user?.role.code);

  useEffect(() => {
    if (!paymentDialogOpen) return;
    const payableIds = new Set(payableOrders.map((order) => order.id));
    setSelectedPaymentOrderIds((current) => {
      const next = new Set([...current].filter((orderId) => payableIds.has(orderId)));
      if (next.size === 0 && payableOrders.length > 0) {
        if (paymentSelectionMode === "SINGLE") {
          next.add(payableOrders[0].id);
        } else if (paymentSelectionMode === "BUNDLE") {
          payableOrders.forEach((order) => next.add(order.id));
        }
      }
      return next;
    });
  }, [payableOrders, paymentDialogOpen, paymentSelectionMode]);

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

  const updateKioskHeaderNavMutation = useMutation({
    mutationFn: () =>
      siteSettingApi.updateKioskHeaderNav({
        password: settingsPassword,
        headerNavVisible: draftHeaderNavVisible,
      }),
    onSuccess: (fresh) => {
      queryClient.setQueryData(["site-settings"], fresh);
      setSettingsPassword("");
      setSettingsPasswordError("");
      setSettingsOpen(false);
      toast.success("로그인바 설정을 저장했습니다.");
    },
    onError: (e) => {
      toastError(e, "로그인바 설정을 저장하지 못했습니다.");
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

  const openPaymentDialog = () => {
    if (!tableName.trim()) {
      toast.error("테이블명이 설정되어야 결제할 수 있습니다.");
      return;
    }
    if (cartItems.length > 0) {
      toast.error("선택한 메뉴를 먼저 주문 접수해주세요.");
      return;
    }
    if (payableOrders.length === 0) {
      toast.error("현재 결제 완료 대기 주문이 없습니다.");
      return;
    }
    setPaymentSelectionMode(null);
    setSelectedPaymentOrderIds(new Set());
    setPaymentDialogOpen(true);
  };

  const selectPaymentMode = (mode: PaymentSelectionMode) => {
    setPaymentSelectionMode(mode);
    if (mode === "SINGLE") {
      setSelectedPaymentOrderIds(new Set(payableOrders[0] ? [payableOrders[0].id] : []));
      return;
    }
    setSelectedPaymentOrderIds(new Set(payableOrders.map((order) => order.id)));
  };

  const togglePaymentOrder = (orderId: number) => {
    if (paymentSelectionMode === "SINGLE") {
      setSelectedPaymentOrderIds((current) => {
        if (current.has(orderId)) {
          return new Set();
        }
        return new Set([orderId]);
      });
      return;
    }
    setSelectedPaymentOrderIds((current) => {
      const next = new Set(current);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const closePaymentDialog = () => {
    if (paymentLaunching) return;
    if (paymentSelectionMode) {
      setPaymentSelectionMode(null);
      setSelectedPaymentOrderIds(new Set());
      return;
    }
    setPaymentDialogOpen(false);
  };

  const requestTossPayment = async () => {
    if (paymentLaunching) return;
    if (cartItems.length > 0) {
      toast.error("선택한 메뉴를 먼저 주문 접수해주세요.");
      return;
    }
    const paymentConfig =
      tossPaymentConfigQuery.data ?? (await tossPaymentConfigQuery.refetch()).data;
    if (!paymentConfig?.clientKey) {
      toast.error("토스 결제 설정이 필요합니다. 서버 환경변수를 확인해주세요.");
      return;
    }
    if (selectedPaymentOrders.length === 0 || selectedPaymentTotalPrice <= 0) {
      toast.error("결제할 주문을 선택해주세요.");
      return;
    }

    setPaymentLaunching(true);
    try {
      const tossOrderId = `rb-${selectedPaymentOrders[0].id}-${Date.now()}`;
      const selectedOrderIds = selectedPaymentOrders.map((order) => order.id);
      const callbackParams = new URLSearchParams({
        tableName,
        restaurantOrderIds: selectedOrderIds.join(","),
      });
      const successUrl = `${window.location.origin}/customer/payment/success?${callbackParams.toString()}`;
      const failUrl = `${window.location.origin}/customer/payment/fail?${callbackParams.toString()}`;

      window.localStorage.setItem(
        `${TOSS_PAYMENT_META_KEY_PREFIX}${tossOrderId}`,
        JSON.stringify({
          tableName,
          restaurantOrderIds: selectedOrderIds,
          amount: selectedPaymentTotalPrice,
        }),
      );

      const tossPayments = await loadTossPayments(paymentConfig.clientKey);
      const payment = tossPayments.payment({ customerKey: "ANONYMOUS" });
      await payment.requestPayment({
        method: "CARD",
        amount: { value: selectedPaymentTotalPrice, currency: "KRW" },
        orderId: tossOrderId,
        orderName:
          selectedPaymentOrders.length === 1
            ? `${selectedPaymentOrders[0].orderNo} 결제`
            : `${tableName} 주문 ${selectedPaymentOrders.length}건 결제`,
        successUrl,
        failUrl,
      });
      setPaymentLaunching(false);
    } catch (e) {
      toastError(e, "토스 결제창을 열지 못했습니다.");
      setPaymentLaunching(false);
    }
  };

  const openSettingsPasswordDialog = () => {
    setSettingsPassword("admin123");
    setSettingsPasswordError("");
    setSettingsPasswordOpen(true);
  };

  const confirmSettingsPassword = () => {
    if (settingsPassword !== "admin123") {
      setSettingsPasswordError("비밀번호가 올바르지 않습니다.");
      return;
    }

    setSettingsPasswordError("");
    setSettingsPasswordOpen(false);
    setDraftHeaderNavVisible(siteSetting?.headerNavVisible ?? true);
    setSettingsOpen(true);
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

  return {
    activeOrdersLoading,
    activeStaffCalls,
    activeTab,
    acceptedOrders,
    acknowledgeCanceledOrdersMutation,
    acknowledgeVisibleCancelNotices,
    basicRequestSelected,
    billableOrders,
    cancelNoticesOpen,
    cancelOrderMutation,
    cancelStaffCallMutation,
    canceledOrder,
    cart,
    cartItems,
    closePaymentDialog,
    completedOrder,
    confirmSettingsPassword,
    createOrderMutation,
    createStaffCallMutation,
    displayQuantity,
    displayTotalPrice,
    draftHeaderNavVisible,
    isError,
    isLoading,
    openPaymentDialog,
    openSettingsPasswordDialog,
    openStaffCallDialog,
    orderConfirmOpen,
    orderType,
    orderTypeLabel,
    payableOrders,
    paymentDialogOpen,
    paymentGuideCopy,
    paymentLaunching,
    paymentSelectionMode,
    products: displayProducts,
    requestSubmitOrder,
    requestTossPayment,
    selectPaymentMode,
    selectedPaymentOrderIds,
    selectedPaymentOrders,
    selectedPaymentTotalPrice,
    setActiveTab,
    setBasicRequestSelected,
    setCancelNoticesOpen,
    setCanceledOrder,
    setCompletedOrder,
    setDraftHeaderNavVisible,
    setOrderConfirmOpen,
    setOrderType,
    setSettingsOpen,
    setSettingsPassword,
    setSettingsPasswordError,
    setSettingsPasswordOpen,
    setStaffCallDialogOpen,
    setStaffCallMessage,
    setStaffCallType,
    settingsOpen,
    settingsPassword,
    settingsPasswordError,
    settingsPasswordOpen,
    staffCallDialogOpen,
    staffCallMessage,
    staffCallType,
    submitOrder,
    tableName,
    tabs,
    togglePaymentOrder,
    toggleProductSelection,
    totalPrice,
    totalQuantity,
    updateCartItemQuantity,
    updateKioskHeaderNavMutation,
    updateQuantity,
    visibleCancelNotices,
  };
}


export type KioskOrderModel = ReturnType<typeof useKioskOrder>;
