type TossPaymentRequest = {
  method: "CARD";
  amount: {
    value: number;
    currency: "KRW";
  };
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
};

type TossPaymentInstance = {
  requestPayment: (request: TossPaymentRequest) => Promise<void>;
};

type TossPaymentsFactory = {
  payment: (options: { customerKey: string }) => TossPaymentInstance;
};

type TossPaymentsWindow = Window & {
  TossPayments?: (clientKey: string) => TossPaymentsFactory;
};

const TOSS_PAYMENTS_SCRIPT_ID = "toss-payments-v2-standard";
const TOSS_PAYMENTS_SCRIPT_URL = "https://js.tosspayments.com/v2/standard";

let loadingPromise: Promise<void> | null = null;

function getTossPayments() {
  return (window as TossPaymentsWindow).TossPayments;
}

export async function loadTossPayments(clientKey: string): Promise<TossPaymentsFactory> {
  if (typeof window === "undefined") {
    throw new Error("TossPayments can only be loaded in the browser.");
  }

  const existing = getTossPayments();
  if (existing) {
    return existing(clientKey);
  }

  if (!loadingPromise) {
    loadingPromise = new Promise<void>((resolve, reject) => {
      const currentScript = document.getElementById(TOSS_PAYMENTS_SCRIPT_ID) as HTMLScriptElement | null;
      if (currentScript) {
        currentScript.addEventListener("load", () => resolve(), { once: true });
        currentScript.addEventListener("error", () => reject(new Error("토스 결제 SDK를 불러오지 못했습니다.")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = TOSS_PAYMENTS_SCRIPT_ID;
      script.src = TOSS_PAYMENTS_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("토스 결제 SDK를 불러오지 못했습니다."));
      document.head.appendChild(script);
    }).finally(() => {
      loadingPromise = null;
    });
  }

  await loadingPromise;
  const loaded = getTossPayments();
  if (!loaded) {
    throw new Error("토스 결제 SDK를 사용할 수 없습니다.");
  }
  return loaded(clientKey);
}
