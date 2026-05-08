"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  CalendarDays,
  ClipboardList,
  Home,
  ImageIcon,
  Loader2,
  Mail,
  NotebookPen,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { authActions, useAuth } from "@/entities/user/model/authStore";
import { uploadProfileImage } from "@/shared/api/upload";
import { toast, toastError } from "@/shared/lib/toast";

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

type Tab = "permissions" | "memo" | "bookmarks";

const tabItems: Array<{ value: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: "permissions", label: "보유 권한", icon: BadgeCheck },
  { value: "memo", label: "메모장", icon: NotebookPen },
  { value: "bookmarks", label: "즐겨찾기", icon: Bookmark },
];

function ProfileContent() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("permissions");
  const [isUploading, setIsUploading] = useState(false);

  if (!user) return null;

  const initials = (user.username ?? "?").slice(0, 2).toUpperCase();
  const joinedAt = formatDate(user.createdAt);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const profileImageUrl = await uploadProfileImage(file);
      await authActions.updateProfileImage(profileImageUrl);
      toast.success("프로필 이미지가 업로드되었습니다.");
    } catch (e) {
      toastError(e, "프로필 이미지 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDeleteImage = async () => {
    setIsUploading(true);
    try {
      await authActions.updateProfileImage(null);
      toast.success("프로필 이미지가 삭제되었습니다.");
    } catch (e) {
      toastError(e, "프로필 이미지 삭제에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-muted/30 px-4 py-5">
      <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          <section className="rounded-lg border border-border bg-background p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">{user.username}</h1>
                  <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    {user.role.name}
                  </span>
                </div>
                <p className="mt-1 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 lg:w-[28rem]">
                <ProfileMetric label="역할" value={user.role.name} icon={ShieldCheck} />
                <ProfileMetric label="권한" value={`${user.permissions.length}개`} icon={BadgeCheck} />
                <ProfileMetric label="가입일" value={joinedAt} icon={CalendarDays} />
              </div>
            </div>
          </section>

          <Section title="기본 정보" description="로그인 계정과 현재 배정된 역할입니다.">
            <div className="grid divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="divide-y divide-border">
                <InfoRow icon={UserRound} label="이름" value={user.username} />
                <InfoRow icon={Mail} label="이메일" value={user.email} />
              </div>
              <div className="divide-y divide-border">
                <InfoRow icon={ShieldCheck} label="역할" value={user.role.name} />
                <InfoRow icon={CalendarDays} label="가입일" value={joinedAt} />
              </div>
            </div>
          </Section>

          <div className="rounded-lg border border-border bg-background p-1">
            <div className="grid gap-1 sm:grid-cols-3">
              {tabItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTab(item.value)}
                    className={`flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors ${
                      tab === item.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {tab === "permissions" && (
            <Section title="보유 권한" description="현재 계정으로 접근 가능한 운영 기능입니다.">
              {user.permissions.length === 0 ? (
                <EmptyState
                  icon={BadgeCheck}
                  title="배정된 권한이 없습니다"
                  description="필요한 메뉴가 보이지 않으면 관리자에게 역할 배정을 요청하세요."
                />
              ) : (
                <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {user.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="inline-flex min-h-10 items-center rounded-md border border-border bg-muted/50 px-3 text-xs font-semibold"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              )}
            </Section>
          )}

          {tab === "memo" && (
            <Section title="메모장" description="브라우저 세션에서 임시로 사용할 수 있는 개인 메모 영역입니다.">
              <div className="p-4">
                <textarea
                  className="h-72 w-full resize-none rounded-md border border-border bg-muted/30 p-4 text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-background"
                  placeholder="메모를 입력하세요..."
                />
              </div>
            </Section>
          )}

          {tab === "bookmarks" && (
            <Section title="즐겨찾기" description="자주 여는 운영 화면을 모아둘 영역입니다.">
              <EmptyState
                icon={Bookmark}
                title="저장된 즐겨찾기가 없습니다"
                description="즐겨찾기 기능이 연결되면 이곳에서 빠르게 이동할 수 있습니다."
              />
            </Section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold">프로필 이미지</h2>
                <p className="mt-1 text-xs text-muted-foreground">계정 대표 이미지</p>
              </div>
              <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>

            <div className="mt-4 flex flex-col items-center gap-3">
              <ProfileAvatar imageUrl={user.profileImageUrl ?? null} initials={initials} size="lg" />
              <div className="text-center">
                <p className="text-sm font-bold">{user.username}</p>
                <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
              <div className="grid w-full gap-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  이미지 업로드
                </button>
                {user.profileImageUrl && (
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={handleDeleteImage}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-destructive/50 px-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    이미지 삭제
                  </button>
                )}
              </div>
            </div>
          </div>

          <Section title="계정 스냅샷" description="현재 로그인 세션 기준">
            <div className="divide-y divide-border">
              <MetaRow label="역할" value={user.role.name} />
              <MetaRow label="권한 수" value={`${user.permissions.length}개`} />
              <MetaRow label="계정 상태" value="활성" />
            </div>
          </Section>

          <div className="rounded-lg border border-border bg-background p-4">
            <h2 className="text-sm font-bold">바로가기</h2>
            <div className="mt-3 grid gap-2">
              <SideLink href="/dashboard" label="대시보드" icon={Home} />
              <SideLink href="/guide" label="사용 가이드" icon={ClipboardList} />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function ProfileAvatar({
  imageUrl,
  initials,
  size,
}: {
  imageUrl: string | null;
  initials: string;
  size: "lg" | "sm";
}) {
  const sizeClass = size === "lg" ? "h-40 w-40 text-3xl" : "h-16 w-16 text-xl";

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-primary font-bold text-primary-foreground ${sizeClass}`}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt="프로필 이미지" fill sizes={size === "lg" ? "160px" : "64px"} className="object-cover" unoptimized />
      ) : (
        initials
      )}
    </div>
  );
}

function ProfileMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 truncate text-sm font-bold">{value}</p>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-bold">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-4 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </span>
      <p className="mt-4 text-sm font-bold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function SideLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex h-11 items-center justify-between rounded-md border border-border px-3 text-sm font-semibold transition-colors hover:bg-accent"
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
