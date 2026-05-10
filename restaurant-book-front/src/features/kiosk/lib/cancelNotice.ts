import type { Order } from "@/entities/order/model/types";
import type { CancelNotice, CancelNoticeItem } from "../model/types";
import { getOrderQuantity } from "./order";

export const toCancelNoticeItems = (order: Order): CancelNoticeItem[] =>
  order.items.map((item) => ({
    id: item.id,
    name: item.name,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
  }));

export const mergeCancelNoticeOrder = (notice: CancelNotice, order: Order): CancelNotice => ({
  ...notice,
  orderNo: notice.orderNo ?? order.orderNo,
  items: notice.items.length > 0 ? notice.items : toCancelNoticeItems(order),
  totalAmount: notice.totalAmount ?? order.totalAmount,
  totalQuantity: notice.totalQuantity ?? getOrderQuantity(order),
});

export const playCancelAlertSound = () => {
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
