"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { Switch } from "@/shared/ui/Switch";

export type HeaderNavVisibilityStore = {
  get: () => boolean;
  set: (visible: boolean) => void;
  subscribe: (listener: () => void) => () => void;
};

type OperationalHeaderSettingsProps = {
  store: HeaderNavVisibilityStore;
  screenName: string;
  description: string;
  hiddenDescription: string;
  buttonSize?: "sm" | "md";
  buttonClassName?: string;
  iconClassName?: string;
  buttonLabel?: string;
};

export function OperationalHeaderSettings({
  store,
  screenName,
  description,
  hiddenDescription,
  buttonSize = "md",
  buttonClassName,
  iconClassName,
  buttonLabel,
}: OperationalHeaderSettingsProps) {
  const [open, setOpen] = useState(false);
  const [headerNavVisible, setHeaderNavVisible] = useState(true);
  const [draftHeaderNavVisible, setDraftHeaderNavVisible] = useState(true);
  const title = `${screenName} 화면 설정`;

  useEffect(() => {
    const syncHeaderNavVisible = () => {
      const visible = store.get();
      setHeaderNavVisible(visible);
      setDraftHeaderNavVisible(visible);
    };
    syncHeaderNavVisible();
    return store.subscribe(syncHeaderNavVisible);
  }, [store]);

  return (
    <>
      <button
        type="button"
        aria-label={title}
        title={title}
        onClick={() => {
          setDraftHeaderNavVisible(headerNavVisible);
          setOpen(true);
        }}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          buttonSize === "sm" ? "h-8 w-8" : "h-10 w-10",
          buttonClassName,
        )}
      >
        <Settings className={cn(buttonSize === "sm" ? "h-3.5 w-3.5" : "h-4 w-4", iconClassName)} />
        {buttonLabel ? <span className="text-xs font-semibold">{buttonLabel}</span> : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-5 shadow-xl">
            <h2 className="text-lg font-black">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>

            <div className="mt-5 flex items-center justify-between gap-4 rounded-md border border-border bg-muted/30 p-4">
              <div>
                <p className="text-sm font-black">헤더 네비 출력 여부</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {hiddenDescription}
                </p>
              </div>
              <Switch
                checked={draftHeaderNavVisible}
                onCheckedChange={setDraftHeaderNavVisible}
                aria-label={`${screenName} 헤더 네비 출력 여부`}
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  store.set(draftHeaderNavVisible);
                  setOpen(false);
                  toast.success(`${screenName} 화면 설정을 저장했습니다.`);
                }}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
