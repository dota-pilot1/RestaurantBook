"use client";

import Image from "next/image";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { uploadImage } from "@/shared/api/upload";
import { toast, toastError } from "@/shared/lib/toast";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
};

export function SaleMenuImageField({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file, "sale-menu");
      onChange(url);
      toast.success("이미지가 업로드되었습니다.");
    } catch (e) {
      toastError(e, "이미지 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
          {value ? (
            <Image src={value} alt="" fill sizes="80px" className="object-cover" unoptimized />
          ) : (
            <ImageIcon className="h-7 w-7 text-muted-foreground" />
          )}
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-60"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            업로드
          </button>
          {value && (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1.5 rounded-md border border-destructive/50 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
