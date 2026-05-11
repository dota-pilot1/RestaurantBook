import type { User } from "@/entities/user/model/types";

export const ROLE_HOME_PATHS: Record<string, string> = {
  ROLE_ADMIN: "/dashboard",
  ROLE_MANAGER: "/manager",
  ROLE_KITCHEN: "/kitchen",
  ROLE_STAFF: "/staff",
  ROLE_CUSTOMER: "/customer",
};

const BLOCKED_NEXT_PATHS = new Set(["/", "/login", "/register", "/unauthorized"]);

const ROLE_ALLOWED_PREFIXES: Array<{ prefixes: string[]; roles: string[] }> = [
  {
    prefixes: [
      "/dashboard",
      "/users",
      "/roles",
      "/permissions",
      "/role-permissions",
      "/permission-categories",
      "/navigation-menus",
      "/admin",
      "/screen-settings",
      "/site-settings",
    ],
    roles: ["ROLE_ADMIN"],
  },
  {
    prefixes: [
      "/manager",
      "/sale-menus",
      "/sale-menu-sets",
      "/sale-menu-categories",
      "/sale-menu-availability",
      "/tables",
      "/sales",
    ],
    roles: ["ROLE_ADMIN", "ROLE_MANAGER"],
  },
  {
    prefixes: ["/orders"],
    roles: ["ROLE_ADMIN", "ROLE_MANAGER", "ROLE_STAFF"],
  },
  {
    prefixes: ["/kitchen", "/kitchen-board"],
    roles: ["ROLE_ADMIN", "ROLE_KITCHEN"],
  },
  {
    prefixes: ["/staff"],
    roles: ["ROLE_ADMIN", "ROLE_STAFF"],
  },
  {
    prefixes: ["/customer"],
    roles: ["ROLE_ADMIN", "ROLE_CUSTOMER"],
  },
];

export function getRoleHomePath(roleCode?: string | null): string {
  return roleCode ? ROLE_HOME_PATHS[roleCode] ?? "/dashboard" : "/dashboard";
}

export function isSafeInternalPath(path?: string | null): path is string {
  return !!path && path.startsWith("/") && !path.startsWith("//");
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

export function canRoleAccessPath(roleCode: string, pathname: string): boolean {
  const rule = ROLE_ALLOWED_PREFIXES.find((item) =>
    item.prefixes.some((prefix) => matchesPrefix(pathname, prefix))
  );
  return !rule || rule.roles.includes(roleCode);
}

export function getPostLoginPath(user: User, nextPath?: string | null): string {
  const normalizedNext =
    isSafeInternalPath(nextPath) && nextPath !== "/"
      ? nextPath.replace(/\/+$/, "") || "/"
      : null;
  const nextPathname = normalizedNext?.split(/[?#]/, 1)[0] ?? null;

  if (normalizedNext && nextPathname && !BLOCKED_NEXT_PATHS.has(nextPathname)) {
    if (!canRoleAccessPath(user.role.code, nextPathname)) {
      return getRoleHomePath(user.role.code);
    }
    return nextPath as string;
  }

  return getRoleHomePath(user.role.code);
}
