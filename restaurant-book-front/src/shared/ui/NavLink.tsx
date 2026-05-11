"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
  className?: string;
}

export function NavLink({ href, children, exact = false, className }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href || pathname === `${href}/` : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium transition-colors",
        isActive
          ? "border-slate-300 bg-slate-100 text-foreground dark:border-border dark:bg-muted"
          : "border-transparent bg-transparent text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-muted/70",
        className
      )}
    >
      {children}
    </Link>
  );
}
