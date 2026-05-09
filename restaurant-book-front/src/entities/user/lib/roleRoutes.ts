import type { User } from "@/entities/user/model/types";

export const ROLE_HOME_PATHS: Record<string, string> = {
  ROLE_ADMIN: "/dashboard",
  ROLE_MANAGER: "/manager",
  ROLE_KITCHEN: "/kitchen",
  ROLE_STAFF: "/staff",
  ROLE_CUSTOMER: "/customer",
};

const BLOCKED_NEXT_PATHS = new Set(["/", "/login", "/register", "/unauthorized"]);

// ROLE_ADMIN 전용 경로 prefix — 다른 역할은 next 파라미터로 진입 불가
const ADMIN_ONLY_PREFIXES = ["/dashboard", "/users", "/roles", "/permissions", "/role-permissions", "/permission-categories", "/navigation-menus", "/admin"];

export function getRoleHomePath(roleCode?: string | null): string {
  return roleCode ? ROLE_HOME_PATHS[roleCode] ?? "/dashboard" : "/dashboard";
}

export function isSafeInternalPath(path?: string | null): path is string {
  return !!path && path.startsWith("/") && !path.startsWith("//");
}

function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

export function getPostLoginPath(user: User, nextPath?: string | null): string {
  const normalizedNext =
    isSafeInternalPath(nextPath) && nextPath !== "/"
      ? nextPath.replace(/\/+$/, "") || "/"
      : null;
  const nextPathname = normalizedNext?.split(/[?#]/, 1)[0] ?? null;

  if (normalizedNext && nextPathname && !BLOCKED_NEXT_PATHS.has(nextPathname)) {
    const isAdmin = user.role.code === "ROLE_ADMIN";
    if (!isAdmin && isAdminOnlyPath(nextPathname)) {
      return getRoleHomePath(user.role.code);
    }
    return nextPath as string;
  }

  return getRoleHomePath(user.role.code);
}
