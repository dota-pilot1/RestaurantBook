"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Info,
  Mail,
  MessageSquare,
  Phone,
  Settings,
  Utensils,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { siteSettingApi } from "@/entities/site-setting/api/siteSettingApi";
import {
  getKitchenHeaderNavVisible,
  getStaffHeaderNavVisible,
  setKitchenHeaderNavVisible,
  setStaffHeaderNavVisible,
} from "@/shared/lib/kitchenHeaderNavVisibility";
import { toast, toastError } from "@/shared/lib/toast";
import { PasswordInput } from "@/shared/ui/PasswordInput";
import { Switch } from "@/shared/ui/Switch";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const { t } = useTranslation("auth");
  const queryClient = useQueryClient();
  const [issueGuideOpen, setIssueGuideOpen] = useState(false);
  const [settingsPasswordOpen, setSettingsPasswordOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPassword, setSettingsPassword] = useState("");
  const [settingsPasswordError, setSettingsPasswordError] = useState("");
  const [draftCustomerHeaderNavVisible, setDraftCustomerHeaderNavVisible] = useState(true);
  const [draftKitchenHeaderNavVisible, setDraftKitchenHeaderNavVisible] = useState(true);
  const [draftStaffHeaderNavVisible, setDraftStaffHeaderNavVisible] = useState(true);

  const { data: siteSetting } = useQuery({
    queryKey: ["site-settings"],
    queryFn: siteSettingApi.get,
    staleTime: 5 * 60 * 1000,
  });

  const heroImageUrl = siteSetting?.heroImageUrl ?? null;

  const updateHeaderNavMutation = useMutation({
    mutationFn: () =>
      siteSettingApi.updateKioskHeaderNav({
        password: settingsPassword,
        headerNavVisible: draftCustomerHeaderNavVisible,
      }),
    onSuccess: (fresh) => {
      queryClient.setQueryData(["site-settings"], fresh);
      setKitchenHeaderNavVisible(draftKitchenHeaderNavVisible);
      setStaffHeaderNavVisible(draftStaffHeaderNavVisible);
      setSettingsPassword("");
      setSettingsPasswordError("");
      setSettingsOpen(false);
      toast.success("화면 헤더 설정을 저장했습니다.");
    },
    onError: (error) => {
      toastError(error, "헤더 설정을 저장하지 못했습니다.");
    },
  });

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
    setDraftCustomerHeaderNavVisible(siteSetting?.headerNavVisible ?? true);
    setDraftKitchenHeaderNavVisible(getKitchenHeaderNavVisible());
    setDraftStaffHeaderNavVisible(getStaffHeaderNavVisible());
    setSettingsOpen(true);
  };

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-muted/20 px-4 py-10 sm:py-14">
      <div className="relative w-full max-w-7xl">
        <div className="relative grid items-stretch overflow-hidden rounded-2xl border border-border bg-background shadow-[0_24px_70px_-18px_rgba(0,0,0,0.22)] ring-1 ring-black/5 lg:min-h-[680px] lg:grid-cols-[5fr_4fr]">
          <span
            aria-hidden
            className="absolute bottom-8 top-8 hidden w-px bg-border lg:left-[55.555%] lg:block"
          />

          <section className="hidden h-full flex-col justify-between gap-8 bg-muted/10 p-8 lg:flex">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Utensils className="h-4 w-4" />
              </span>
              식당 키오스크
            </div>

            <div className="relative overflow-hidden rounded-xl border border-border bg-background shadow-sm">
              {heroImageUrl ? (
                <Image
                  src={heroImageUrl}
                  alt={t("heroImageAlt")}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 512px"
                  className="object-cover"
                />
              ) : (
                <>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-10 w-10" />
                    <span className="text-xs font-medium">
                      {t("imagePlaceholder")}
                    </span>
                  </div>
                  <span className="absolute top-2 left-2 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground ring-1 ring-border">
                    {t("imagePlaceholderTag", { defaultValue: "PLACEHOLDER" })}
                  </span>
                </>
              )}
              <div className="aspect-[4/3]" />
            </div>

            <p className="text-[10px] text-muted-foreground">
              © {new Date().getFullYear()} RestaurantBook
            </p>
          </section>

          {/* Right page — form */}
          <section className="relative flex h-full items-center justify-center p-6 sm:p-8 lg:px-10">
            <div className="absolute left-4 right-4 top-4 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIssueGuideOpen(true)}
                className="inline-flex items-center gap-1.5 rounded border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {t("issueInquiry")}
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </button>
              <Link
                href="/about2"
                className="inline-flex items-center gap-1.5 rounded border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                <BookOpen className="h-3.5 w-3.5" />
                사용 가이드
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 rounded border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Info className="h-3.5 w-3.5" />
                {t("serviceIntro")}
              </Link>
              <button
                type="button"
                aria-label="화면 헤더 설정"
                title="화면 헤더 설정"
                onClick={openSettingsPasswordDialog}
                className="inline-flex items-center gap-1.5 rounded border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Settings className="h-3.5 w-3.5" />
                헤더 설정
              </button>
            </div>
            <div className="w-full max-w-lg space-y-5">
              <div className="space-y-1.5 text-center lg:text-left">
                <h1 className="text-xl font-bold tracking-tight">{title}</h1>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>
              {children}
            </div>
          </section>
        </div>
      </div>
      {issueGuideOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="issue-guide-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
        >
          <div className="w-full max-w-xl rounded-lg border border-border bg-background p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="issue-guide-title" className="text-lg font-black">
                  {t("issueGuideTitle")}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t("issueGuideDescription")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIssueGuideOpen(false)}
                aria-label={t("issueGuideClose")}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-md border border-border bg-muted/30 p-4 text-sm leading-6">
              <p className="font-semibold text-foreground">{t("issueGuideStepTitle")}</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>{t("issueGuideStepSignup")}</li>
                <li>{t("issueGuideStepRegister")}</li>
              </ol>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <IssueGuideInfoLink
                icon={Globe}
                label={t("issueGuideProjectUrlLabel")}
                value="smart-fnb-design.com"
                href="https://smart-fnb-design.com/"
              />
              <IssueGuideInfoLink
                icon={Phone}
                label={t("issueGuidePhoneLabel")}
                value="010-4903-8056"
                href="tel:01049038056"
              />
              <IssueGuideInfoLink
                icon={Mail}
                label={t("issueGuideEmailLabel")}
                value="terecal@daum.net"
                href="mailto:terecal@daum.net"
                className="sm:col-span-2"
              />
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIssueGuideOpen(false)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent"
              >
                {t("issueGuideClose")}
              </button>
              <a
                href="https://hibot-docu.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold hover:bg-accent"
              >
                {t("issueGuideSignupLink")}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://hibot-docu.com/issues?prototypeId=prototype-943425"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                {t("issueGuideIssuesLink")}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      ) : null}
      {settingsPasswordOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              confirmSettingsPassword();
            }}
            className="w-full max-w-sm rounded-lg border border-border bg-background p-5 shadow-xl"
          >
            <h2 className="text-lg font-black">화면 헤더 설정</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              설정을 변경하려면 관리자 비밀번호를 입력해주세요.
            </p>
            <div className="mt-4">
              <label className="text-sm font-bold" htmlFor="auth-header-settings-password">
                비밀번호
              </label>
              <div className="mt-2">
                <PasswordInput
                  id="auth-header-settings-password"
                  value={settingsPassword}
                  autoFocus
                  onChange={(event) => {
                    setSettingsPassword(event.target.value);
                    setSettingsPasswordError("");
                  }}
                  invalid={!!settingsPasswordError}
                  className="h-11"
                />
              </div>
              {settingsPasswordError ? (
                <p className="mt-2 text-xs font-semibold text-destructive">
                  {settingsPasswordError}
                </p>
              ) : null}
            </div>
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
              <button
                type="submit"
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                확인
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {settingsOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-5 shadow-xl">
            <h2 className="text-lg font-black">화면 헤더 설정</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              고객, 주방, 직원 화면의 상단 헤더 표시 방식을 조정합니다.
            </p>

            <div className="mt-5 space-y-3">
              <HeaderVisibilitySwitch
                title="고객 화면"
                description="끄면 고객 주문 화면에서 상단 헤더가 숨겨집니다."
                checked={draftCustomerHeaderNavVisible}
                onCheckedChange={setDraftCustomerHeaderNavVisible}
              />
              <HeaderVisibilitySwitch
                title="주방 화면"
                description="끄면 주방 화면에서 상단 헤더가 숨겨집니다."
                checked={draftKitchenHeaderNavVisible}
                onCheckedChange={setDraftKitchenHeaderNavVisible}
              />
              <HeaderVisibilitySwitch
                title="직원 화면"
                description="끄면 직원 화면에서 상단 헤더가 숨겨집니다."
                checked={draftStaffHeaderNavVisible}
                onCheckedChange={setDraftStaffHeaderNavVisible}
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={updateHeaderNavMutation.isPending}
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
                disabled={updateHeaderNavMutation.isPending}
                onClick={() => updateHeaderNavMutation.mutate()}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {updateHeaderNavMutation.isPending ? "저장 중" : "저장"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function HeaderVisibilitySwitch({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-muted/30 p-4">
      <div>
        <p className="text-sm font-black">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={`${title} 헤더 네비 출력 여부`}
      />
    </div>
  );
}

function IssueGuideInfoLink({
  icon: Icon,
  label,
  value,
  href,
  className = "",
}: {
  icon: typeof Globe;
  label: string;
  value: string;
  href: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className={`flex min-w-0 items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5 text-sm hover:bg-accent ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="block truncate font-bold text-foreground">{value}</span>
      </span>
    </a>
  );
}
