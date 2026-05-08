"use client";

import Image from "next/image";
import Link from "next/link";
import { Image as ImageIcon, Info, Utensils } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { siteSettingApi } from "@/entities/site-setting/api/siteSettingApi";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const { t } = useTranslation("auth");

  const { data: siteSetting } = useQuery({
    queryKey: ["site-settings"],
    queryFn: siteSettingApi.get,
    staleTime: 5 * 60 * 1000,
  });

  const heroImageUrl = siteSetting?.heroImageUrl ?? null;

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-muted/20 px-4 py-10 sm:py-14">
      <div className="relative w-full max-w-6xl">
        <div className="relative grid items-stretch overflow-hidden rounded-2xl border border-border bg-background shadow-[0_24px_70px_-18px_rgba(0,0,0,0.22)] ring-1 ring-black/5 lg:min-h-[680px] lg:grid-cols-[3fr_2fr]">
          <span
            aria-hidden
            className="absolute bottom-8 top-8 hidden w-px bg-border lg:left-[60%] lg:block"
          />

          <section className="hidden h-full flex-col justify-between gap-8 bg-muted/10 p-8 lg:flex">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Utensils className="h-4 w-4" />
              </span>
              RestaurantBook
            </div>

            <div className="relative overflow-hidden rounded-xl border border-border bg-background shadow-sm">
              {heroImageUrl ? (
                <Image
                  src={heroImageUrl}
                  alt="대문 이미지"
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
                      {t("imagePlaceholder", { defaultValue: "소개 이미지 영역" })}
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
          <section className="relative flex h-full items-center justify-center p-6 sm:p-8">
            <Link
              href="/about"
              className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Info className="h-3.5 w-3.5" />
              서비스 소개
            </Link>
            <div className="w-full max-w-sm space-y-5">
              <div className="space-y-1.5 text-center lg:text-left">
                <h1 className="text-xl font-bold tracking-tight">{title}</h1>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>
              {children}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
