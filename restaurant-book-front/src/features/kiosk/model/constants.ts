import type { Order } from "@/entities/order/model/types";
import type { StaffCallType } from "@/entities/staff-call/model/types";
import type { KioskTab } from "./types";

export const SET_TAB: KioskTab = { type: "SET", label: "세트" };
export const ALL_TAB: KioskTab = { type: "ALL", label: "전체 보기" };
export const CUSTOMER_ORDER_REFETCH_INTERVAL_MS = 20000;
export const TOSS_PAYMENT_META_KEY_PREFIX = "restaurantBook:tossPayment:";

export const orderStatusLabel: Record<Order["status"], string> = {
  RECEIVED: "주문 접수 대기",
  ACCEPTED: "주문 접수 완료",
  COOKING: "조리 중",
  READY: "조리 완료/결제 대기",
  COMPLETED: "결제 완료",
  CANCELED: "취소",
};

export const orderStatusBadgeClass: Record<Order["status"], string> = {
  RECEIVED: "border-amber-500/30 bg-amber-50 text-amber-700",
  ACCEPTED: "border-sky-500/30 bg-sky-50 text-sky-700",
  COOKING: "border-blue-500/30 bg-blue-50 text-blue-700",
  READY: "border-emerald-500/30 bg-emerald-50 text-emerald-700",
  COMPLETED: "border-slate-500/30 bg-slate-50 text-slate-700",
  CANCELED: "border-red-500/30 bg-red-50 text-red-700",
};

export const orderStatusCardClass: Record<Order["status"], string> = {
  RECEIVED: "border-amber-300 bg-background shadow-[inset_4px_0_0_rgb(245_158_11)]",
  ACCEPTED: "border-sky-300 bg-background shadow-[inset_4px_0_0_rgb(14_165_233)]",
  COOKING: "border-blue-300 bg-background shadow-[inset_4px_0_0_rgb(59_130_246)]",
  READY: "border-emerald-300 bg-background shadow-[inset_4px_0_0_rgb(16_185_129)]",
  COMPLETED: "border-slate-300 bg-background shadow-[inset_4px_0_0_rgb(100_116_139)]",
  CANCELED: "border-red-300 bg-background shadow-[inset_4px_0_0_rgb(239_68_68)]",
};

export const staffCallTypeLabel: Record<StaffCallType, string> = {
  GENERAL: "일반 호출",
  REFILL: "물/반찬 리필",
  QUESTION: "메뉴 문의",
  PAYMENT: "결제 도움",
  OTHER: "기타",
};

export const getPaymentGuideCopy = (roleCode?: string | null) => {
  switch (roleCode) {
    case "ROLE_ADMIN":
    case "ROLE_MANAGER":
      return {
        title: "매출 집계 안내",
        description: "매출 통계는 결제 완료와 환불 기록을 기준으로 집계됩니다.",
      };
    case "ROLE_STAFF":
      return {
        title: "직원 결제 안내",
        description: "고객 간편결제는 자동 반영되고, 카드/현금/기타 결제는 직원이 직접 처리합니다.",
      };
    case "ROLE_KITCHEN":
      return {
        title: "조리 완료 안내",
        description: "주방은 조리 완료까지만 처리하고, 결제는 고객 또는 직원 화면에서 진행됩니다.",
      };
    default:
      return {
        title: "후불 결제 안내",
        description: "조리 완료된 주문은 결제 버튼으로 후불 결제할 수 있습니다. 선불 결제가 필요하면 직원에게 미리 말씀해주세요.",
      };
  }
};
