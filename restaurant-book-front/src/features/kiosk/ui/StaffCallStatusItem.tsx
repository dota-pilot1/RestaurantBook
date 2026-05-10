import { useEffect, useState } from "react";
import type { StaffCall } from "@/entities/staff-call/model/types";
import { staffCallTypeLabel } from "../model/constants";

export function StaffCallStatusItem({
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
