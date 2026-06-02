import Link from "next/link";
import { Mail, Phone } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          {/* 상호명 */}
          <p className="text-base font-bold text-foreground">RestaurantBook</p>
          <p>상호명: RestaurantBook</p>
          <p>대표자: 오현석</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0" />
            <span>010-4903-8056</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0" />
            <a
              href="mailto:terecal@daum.net"
              className="transition-colors hover:text-foreground"
            >
              terecal@daum.net
            </a>
          </div>
          <Link
            href="/about"
            className="inline-block transition-colors hover:text-foreground"
          >
            서비스 소개
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-5xl border-t border-border pt-4 text-xs">
        <p>© {year} RestaurantBook. All rights reserved.</p>
      </div>
    </footer>
  );
}
