"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  ImageIcon,
  Minus,
  Package,
  Phone,
  Plus,
  QrCode,
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
import { saleMenuCategoryApi } from "@/entities/sale-menu-category/api/saleMenuCategoryApi";

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
};

const SET_TAB: KioskTab = { type: "SET", label: "세트" };

const formatPrice = (value: number) => value.toLocaleString("ko-KR");

const toCustomerOrderType = (orderType: KioskOrderType): CustomerOrderType =>
  orderType === "dine-in" ? "DINE_IN" : "TAKEOUT";

const toCartKey = (type: SaleProductType, id: number): CartItemKey => `${type}:${id}`;

export function KioskHome() {
  const [orderType, setOrderType] = useState<KioskOrderType>("dine-in");
  const [activeTab, setActiveTab] = useState<KioskTab>(SET_TAB);
  const [cart, setCart] = useState<Record<CartItemKey, CartItem>>({});

  const customerOrderType = toCustomerOrderType(orderType);

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

  const cartItems = useMemo(
    () => Object.values(cart).sort((a, b) => a.name.localeCompare(b.name, "ko-KR")),
    [cart]
  );

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const orderTypeLabel = useMemo(
    () => (orderType === "dine-in" ? "매장 식사" : "포장 주문"),
    [orderType]
  );

  const updateQuantity = (product: CustomerSaleProduct, delta: number) => {
    if (delta > 0 && product.status === "SOLD_OUT") return;

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
        };
      }

      return next;
    });
  };

  const updateCartItemQuantity = (item: CartItem, delta: number) => {
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
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-4 py-4">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1fr_360px]">
        <section className="min-w-0 space-y-4">
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Utensils className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">키오스크 주문</h1>
                <p className="text-sm text-muted-foreground">RestaurantBook</p>
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
                      : "border-border bg-background text-foreground hover:bg-accent"
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
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => {
                const key = toCartKey(product.type, product.id);
                return (
                  <MenuCard
                    key={key}
                    product={product}
                    quantity={cart[key]?.quantity ?? 0}
                    onMinus={() => updateQuantity(product, -1)}
                    onPlus={() => updateQuantity(product, 1)}
                  />
                );
              })}
            </div>
          )}
        </section>

        <aside className="lg:sticky lg:top-[4.5rem] lg:self-start">
          <div className="rounded-lg border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">주문 내역</h2>
              </div>
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                {orderTypeLabel}
              </span>
            </div>

            <div className="min-h-48 divide-y divide-border">
              {cartItems.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                  선택한 메뉴가 없습니다
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.key} className="px-4 py-3">
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
                ))
              )}
            </div>

            <div className="space-y-3 border-t border-border p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">수량</span>
                <span className="font-semibold">{totalQuantity}개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">결제 금액</span>
                <span className="text-2xl font-bold">{formatPrice(totalPrice)}원</span>
              </div>

              <button
                type="button"
                disabled={totalQuantity === 0}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CreditCard className="h-4 w-4" />
                결제하기
              </button>

              <div className="grid grid-cols-[88px_1fr] gap-3 rounded-md border border-dashed border-border bg-muted/30 p-3">
                <div className="flex aspect-square items-center justify-center rounded-md bg-background">
                  <QrCode className="h-10 w-10 text-foreground" />
                </div>
                <div className="flex min-w-0 flex-col justify-center gap-1">
                  <p className="text-sm font-semibold">QR 간편결제</p>
                  <p className="text-xs text-muted-foreground">
                    카카오페이 연동 전까지 결제 진입 위치만 고정합니다.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background text-sm font-medium transition-colors hover:bg-accent"
                >
                  <ReceiptText className="h-4 w-4" />
                  주문 확인
                </button>
                <button
                  type="button"
                  className="flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background text-sm font-medium transition-colors hover:bg-accent"
                >
                  <Phone className="h-4 w-4" />
                  직원 호출
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
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
}: {
  product: CustomerSaleProduct;
  quantity: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  const soldOut = product.status === "SOLD_OUT";
  const isSet = product.type === "SALE_MENU_SET";
  const visibleComponents = product.components.slice(0, 3);
  const hiddenComponentCount = Math.max(0, product.components.length - visibleComponents.length);
  const componentSummary = product.components
    .map((component) => `${component.name} x${component.quantity}`)
    .join(" · ");
  const addToCart = () => {
    if (!soldOut) onPlus();
  };

  return (
    <article
      aria-label={`${product.name} 담기`}
      className={`overflow-hidden rounded-lg border border-border bg-background transition-colors ${
        soldOut
          ? "opacity-75"
          : "cursor-pointer hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      }`}
      onClick={addToCart}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        addToCart();
      }}
      role="button"
      tabIndex={soldOut ? -1 : 0}
    >
      <div className="relative h-28 overflow-hidden bg-muted">
        {product.imageUrl ? (
          <div
            aria-label={product.name}
            className="h-full w-full bg-cover bg-center"
            role="img"
            style={{ backgroundImage: `url(${product.imageUrl})` }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
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
              <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
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
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {visibleComponents.map((component) => (
                      <span
                        key={`${component.name}:${component.quantity}`}
                        className="max-w-full rounded-md bg-muted px-2 py-1 text-xs font-semibold text-foreground"
                      >
                        {component.name} x{component.quantity}
                      </span>
                    ))}
                    {hiddenComponentCount > 0 && (
                      <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                        +{hiddenComponentCount}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    구성: {componentSummary}
                  </p>
                </>
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
                <span className="flex h-9 w-10 items-center justify-center rounded-md bg-muted text-sm font-bold">
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
