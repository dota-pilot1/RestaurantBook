"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/entities/user/model/authStore";
import { getRoleHomePath } from "@/entities/user/lib/roleRoutes";

type Props = {
  roles: string[];
  children: React.ReactNode;
};

export function RequireRole({ roles, children }: Props) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
      return;
    }
    if (status === "authenticated" && user && !roles.includes(user.role.code)) {
      router.replace(getRoleHomePath(user.role.code));
    }
  }, [status, user, roles, router, pathname]);

  if (status === "idle" || status === "loading") return null;
  if (status === "anonymous") return null;
  if (user && roles.includes(user.role.code)) return <>{children}</>;
  return null;
}
