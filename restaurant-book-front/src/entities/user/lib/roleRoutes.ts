import type { User } from "@/entities/user/model/types";

export const ROLE_HOME_PATHS: Record<string, string> = {
  ROLE_ADMIN: "/dashboard",
  ROLE_MANAGER: "/manager",
  ROLE_KITCHEN: "/kitchen",
  ROLE_STAFF: "/staff",
  ROLE_CUSTOMER: "/customer",
};

const BLOCKED_NEXT_PATHS = new Set(["/", "/login", "/register", "/unauthorized"]);

export function getRoleHomePath(roleCode?: string | null): string {
  return roleCode ? ROLE_HOME_PATHS[roleCode] ?? "/dashboard" : "/dashboard";
}

export function isSafeInternalPath(path?: string | null): path is string {
  return !!path && path.startsWith("/") && !path.startsWith("//");
}

export function getPostLoginPath(user: User, nextPath?: string | null): string {
  const normalizedNext =
    isSafeInternalPath(nextPath) && nextPath !== "/"
      ? nextPath.replace(/\/+$/, "") || "/"
      : null;
  const nextPathname = normalizedNext?.split(/[?#]/, 1)[0] ?? null;

  if (normalizedNext && nextPathname && !BLOCKED_NEXT_PATHS.has(nextPathname)) {
    return nextPath as string;
  }

  return getRoleHomePath(user.role.code);
}
