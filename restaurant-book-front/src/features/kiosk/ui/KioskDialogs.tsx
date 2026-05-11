import { Check } from "lucide-react";
import type { StaffCallType } from "@/entities/staff-call/model/types";
import { cn } from "@/shared/lib/utils";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { NoticeDialog } from "@/shared/ui/NoticeDialog";
import { PasswordInput } from "@/shared/ui/PasswordInput";
import { Switch } from "@/shared/ui/Switch";
import { formatTime } from "../lib/format";
import { staffCallTypeLabel } from "../model/constants";
import type { KioskOrderModel } from "../model/useKioskOrder";
import { MenuDetailDialog } from "./MenuDetailDialog";
import { CanceledOrderSummary, OrderConfirmSummary, OrderNoticeSummary } from "./OrderSummaries";
import { PaymentModePicker } from "./PaymentModePicker";
import { PaymentReadySummary } from "./PaymentReadySummary";

export function KioskDialogs({ kiosk }: { kiosk: KioskOrderModel }) {
  const {
    acknowledgeCanceledOrdersMutation,
    acknowledgeVisibleCancelNotices,
    basicRequestSelected,
    cancelNoticesOpen,
    canceledOrder,
    cartItems,
    closePaymentDialog,
    completedOrder,
    confirmSettingsPassword,
    createOrderMutation,
    createStaffCallMutation,
    closeProductDetail,
    detailProduct,
    draftHeaderNavVisible,
    orderConfirmOpen,
    orderTypeLabel,
    payableOrders,
    paymentDialogOpen,
    paymentLaunching,
    paymentSelectionMode,
    requestTossPayment,
    selectPaymentMode,
    selectedPaymentOrderIds,
    selectedPaymentOrders,
    selectedPaymentTotalPrice,
    setBasicRequestSelected,
    setCanceledOrder,
    setCompletedOrder,
    setDraftHeaderNavVisible,
    setOrderConfirmOpen,
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
    togglePaymentOrder,
    totalPrice,
    totalQuantity,
    updateKioskHeaderNavMutation,
    visibleCancelNotices,
  } = kiosk;

  return (
    <>
      <ConfirmDialog
        open={orderConfirmOpen}
        title="주문을 접수할까요?"
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
      <ConfirmDialog
        open={paymentDialogOpen}
        title={paymentSelectionMode ? "결제할 주문을 확인해주세요" : "결제 방식을 선택해주세요"}
        description={
          paymentSelectionMode
            ? "선택한 주문 묶음에 대해 토스 결제창을 한 번만 엽니다."
            : "단건은 주문 1건만 결제하고, 다건은 여러 주문을 한 번에 묶어 결제합니다."
        }
        confirmText={
          !paymentSelectionMode
            ? "결제 방식 선택"
            : paymentLaunching
              ? "결제창 여는 중"
              : "테스트 결제하기"
        }
        cancelText={paymentSelectionMode ? "방식 변경" : "닫기"}
        loading={paymentLaunching}
        confirmDisabled={!paymentSelectionMode || selectedPaymentOrders.length === 0 || selectedPaymentTotalPrice <= 0}
        onCancel={closePaymentDialog}
        onConfirm={() => {
          if (!paymentSelectionMode) return;
          void requestTossPayment();
        }}
      >
        {paymentSelectionMode ? (
          <PaymentReadySummary
            mode={paymentSelectionMode}
            orders={payableOrders}
            selectedOrderIds={selectedPaymentOrderIds}
            tableName={tableName}
            totalPrice={selectedPaymentTotalPrice}
            onToggleOrder={togglePaymentOrder}
          />
        ) : (
          <PaymentModePicker
            orders={payableOrders}
            onSelectMode={selectPaymentMode}
          />
        )}
      </ConfirmDialog>
      <NoticeDialog
        open={cancelNoticesOpen}
        title="취소 안내"
        tone="error"
        confirmText="확인"
        onConfirm={acknowledgeVisibleCancelNotices}
      >
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">취소된 주문입니다.</p>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {visibleCancelNotices.map((notice) => (
              <div key={notice.key} className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-red-700">
                  <span className="min-w-0 truncate">
                    {notice.orderNo ? `주문번호: ${notice.orderNo}` : "취소된 주문"}
                  </span>
                  <span className="shrink-0">{formatTime(notice.receivedAt.toISOString())}</span>
                </div>
                <p className="mt-2 text-sm font-bold text-red-800">{notice.message}</p>
              </div>
            ))}
          </div>
        </div>
      </NoticeDialog>
      {staffCallDialogOpen ? (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
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
                          checked ? "border-primary text-primary" : "border-border hover:bg-accent",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                            checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
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
                  {(["GENERAL", "REFILL", "QUESTION", "PAYMENT", "OTHER"] as StaffCallType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setStaffCallType(type)}
                      className={cn(
                        "h-11 rounded-md border text-sm font-bold transition-colors",
                        staffCallType === type
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-accent",
                      )}
                    >
                      {staffCallTypeLabel[type]}
                    </button>
                  ))}
                </div>
                <textarea
                  value={staffCallMessage}
                  onChange={(event) => setStaffCallMessage(event.target.value)}
                  rows={4}
                  maxLength={200}
                  placeholder="추가 메시지를 입력해주세요. (선택)"
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
                className="h-10 rounded-md border border-border px-4 text-sm font-bold hover:bg-accent disabled:opacity-60"
              >
                닫기
              </button>
              <button
                type="button"
                disabled={createStaffCallMutation.isPending || !tableName.trim()}
                onClick={() => createStaffCallMutation.mutate()}
                className="h-10 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {createStaffCallMutation.isPending ? "요청 중" : "요청하기"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {settingsPasswordOpen ? (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              confirmSettingsPassword();
            }}
            className="w-full max-w-sm rounded-lg border border-border bg-background p-5 shadow-xl"
          >
            <h2 className="text-lg font-black">로그인바 설정</h2>
            <PasswordInput
              id="kiosk-settings-password-mobile"
              value={settingsPassword}
              autoFocus
              onChange={(event) => {
                setSettingsPassword(event.target.value);
                setSettingsPasswordError("");
              }}
              invalid={!!settingsPasswordError}
              className="mt-4 h-11"
            />
            {settingsPasswordError ? (
              <p className="mt-2 text-xs font-semibold text-destructive">{settingsPasswordError}</p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSettingsPasswordOpen(false);
                  setSettingsPassword("");
                  setSettingsPasswordError("");
                }}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent"
              >
                취소
              </button>
              <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground hover:opacity-90">
                확인
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {settingsOpen ? (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-5 shadow-xl">
            <h2 className="text-lg font-black">로그인바 설정</h2>
            <div className="mt-5 flex items-center justify-between gap-4 rounded-md border border-border bg-muted/30 p-4">
              <div>
                <p className="text-sm font-black">로그인바 출력 여부</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  끄면 키오스크 화면에서 상단 로그인/로그아웃 바가 숨겨집니다.
                </p>
              </div>
              <Switch
                checked={draftHeaderNavVisible}
                onCheckedChange={setDraftHeaderNavVisible}
                aria-label="로그인바 출력 여부"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={updateKioskHeaderNavMutation.isPending}
                onClick={() => {
                  setSettingsOpen(false);
                  setSettingsPassword("");
                  setSettingsPasswordError("");
                }}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                disabled={updateKioskHeaderNavMutation.isPending}
                onClick={() => updateKioskHeaderNavMutation.mutate()}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {updateKioskHeaderNavMutation.isPending ? "저장 중" : "저장"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <MenuDetailDialog product={detailProduct} onClose={closeProductDetail} />
    </>
  );
}
