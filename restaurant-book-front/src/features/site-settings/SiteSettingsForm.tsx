"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, Upload, Loader2, Trash2 } from "lucide-react";
import { siteSettingApi } from "@/entities/site-setting/api/siteSettingApi";
import { uploadImage } from "@/shared/api/upload";
import { toast, toastError } from "@/shared/lib/toast";
import { Switch } from "@/shared/ui/Switch";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;
const HERO_IMAGE_WIDTH = 1600;
const HERO_IMAGE_HEIGHT = 1100;
const HERO_IMAGE_ASPECT_LABEL = "16:11";

function getHeroImages(data?: { heroImageUrl: string | null; heroImageUrls?: string[] }) {
  if (!data) return [];
  if (data.heroImageUrls?.length) return data.heroImageUrls;
  return data.heroImageUrl ? [data.heroImageUrl] : [];
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("이미지 변환에 실패했습니다."));
        }
      },
      type,
      quality
    );
  });
}

async function normalizeHeroImage(file: File) {
  const imageUrl = URL.createObjectURL(file);
  const image = document.createElement("img");
  image.decoding = "async";
  image.src = imageUrl;

  try {
    await image.decode();

    const sourceAspect = image.naturalWidth / image.naturalHeight;
    const targetAspect = HERO_IMAGE_WIDTH / HERO_IMAGE_HEIGHT;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = image.naturalWidth;
    let sourceHeight = image.naturalHeight;

    if (sourceAspect > targetAspect) {
      sourceWidth = Math.round(image.naturalHeight * targetAspect);
      sourceX = Math.round((image.naturalWidth - sourceWidth) / 2);
    } else if (sourceAspect < targetAspect) {
      sourceHeight = Math.round(image.naturalWidth / targetAspect);
      sourceY = Math.round((image.naturalHeight - sourceHeight) / 2);
    }

    const canvas = document.createElement("canvas");
    canvas.width = HERO_IMAGE_WIDTH;
    canvas.height = HERO_IMAGE_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("이미지 변환을 지원하지 않는 브라우저입니다.");
    }

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      HERO_IMAGE_WIDTH,
      HERO_IMAGE_HEIGHT
    );

    const blob = await canvasToBlob(canvas, "image/webp", 0.9);
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}-login-hero.webp`, { type: "image/webp" });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function SiteSettingsForm() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [heroImageUrls, setHeroImageUrls] = useState<string[]>([]);
  const [headerNavVisible, setHeaderNavVisible] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: siteSettingApi.get,
  });

  useEffect(() => {
    if (data) {
      setHeroImageUrls(getHeroImages(data));
      setHeaderNavVisible(data.headerNavVisible);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      siteSettingApi.update({
        heroImageUrl: heroImageUrls[0] ?? null,
        heroImageUrls,
        headerNavVisible,
      }),
    onSuccess: (fresh) => {
      toast.success("메인 설정이 저장되었습니다.");
      qc.setQueryData(["site-settings"], fresh);
      setHeroImageUrls(getHeroImages(fresh));
    },
    onError: (e) => toastError(e, "저장에 실패했습니다."),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const invalidType = files.find((file) => !ALLOWED_TYPES.includes(file.type));
    if (invalidType) {
      toast.error("PNG, JPG, WEBP, GIF 이미지만 업로드할 수 있습니다.");
      return;
    }
    const oversized = files.find((file) => file.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized) {
      toast.error(`파일 크기는 ${MAX_SIZE_MB}MB 이하여야 합니다.`);
      return;
    }

    setIsUploading(true);
    try {
      const normalizedFiles = await Promise.all(files.map(normalizeHeroImage));
      const uploadedUrls = await Promise.all(
        normalizedFiles.map((file) => uploadImage(file, "site"))
      );
      setHeroImageUrls((prev) => [...prev, ...uploadedUrls]);
      toast.success(`${HERO_IMAGE_ASPECT_LABEL} 로그인 이미지로 맞춰 업로드했습니다. 저장을 눌러 반영하세요.`);
    } catch (err) {
      toastError(err, "이미지 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setHeroImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const persistedHeroImageUrls = getHeroImages(data);
  const hasChanges = JSON.stringify(heroImageUrls) !== JSON.stringify(persistedHeroImageUrls);
  const hasSettingChanges =
    hasChanges || headerNavVisible !== (data?.headerNavVisible ?? true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        saveMutation.mutate();
      }}
      className="flex flex-1 flex-col gap-6"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">메인 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            로그인/회원가입 화면에 노출되는 대문 이미지를 여러 장 관리합니다.
          </p>
        </div>
        <button
          type="submit"
          disabled={saveMutation.isPending || !hasSettingChanges}
          className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {saveMutation.isPending ? "저장 중..." : "저장"}
        </button>
      </header>

      <div className="grid flex-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">
              대문 이미지
            </label>
            <span className="text-xs text-muted-foreground">
              PNG/JPG/WEBP/GIF · 장당 최대 {MAX_SIZE_MB}MB · 자동 {HERO_IMAGE_ASPECT_LABEL} 크롭
            </span>
          </div>

          <div className="relative flex-1 min-h-[320px] overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30">
            {heroImageUrls[0] ? (
              <Image
                src={heroImageUrls[0]}
                alt="대문 이미지"
                fill
                className="object-cover"
                unoptimized
                sizes="(max-width: 1024px) 100vw, 560px"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="h-10 w-10" />
                <span className="text-xs">등록된 이미지가 없습니다.</span>
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <Loader2 className="h-6 w-6 animate-spin text-foreground" />
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(",")}
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-60"
            >
              <Upload className="h-3.5 w-3.5" />
              이미지 추가
            </button>
            <span className="text-xs text-muted-foreground">
              {heroImageUrls.length}장 등록됨
            </span>
          </div>

          {heroImageUrls.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {heroImageUrls.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="group relative aspect-[16/11] overflow-hidden rounded-md border border-border bg-muted"
                >
                  <Image
                    src={url}
                    alt={`대문 이미지 ${index + 1}`}
                    fill
                    unoptimized
                    sizes="160px"
                    className="object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-bold text-foreground shadow-sm">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    aria-label={`대문 이미지 ${index + 1} 제거`}
                    className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md bg-background/90 text-muted-foreground shadow-sm hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground">
                  키오스크 헤더 네비 출력
                </label>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  끄면 키오스크 화면에서 상단 헤더가 숨겨집니다.
                </p>
              </div>
              <Switch
                checked={headerNavVisible}
                onCheckedChange={setHeaderNavVisible}
                aria-label="키오스크 헤더 네비 출력 여부"
              />
            </div>
          </section>
        </div>
      </div>

    </form>
  );
}
