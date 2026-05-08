"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  BadgeCheck,
  BarChart3,
  BookOpen,
  ChevronDown,
  ClipboardList,
  Eye,
  LayoutDashboard,
  LayoutGrid,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  MonitorCog,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  UserCircle,
  UserPlus,
  Users,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth, authActions } from "@/entities/user/model/authStore";
import { navigationMenuApi } from "@/entities/navigation-menu/api/navigationMenuApi";
import type { NavigationMenuRecord, NavigationMenuItem } from "@/entities/navigation-menu/model/types";
import { siteSettingApi } from "@/entities/site-setting/api/siteSettingApi";
import { RoleBadge } from "@/features/user-management/RoleBadge";
import { NavLink } from "@/shared/ui/NavLink";
import { ThemeSwitcher } from "@/shared/ui/theme/ThemeSwitcher";
import { LanguageSelect } from "@/shared/ui/LanguageSelect";
import { tableSessionStorage } from "@/shared/lib/tableSessionStorage";
import { TablePickerDialog } from "@/features/table-picker/TablePickerDialog";

function buildTree(flat: NavigationMenuRecord[], userRole: string | null): NavigationMenuItem[] {
  const visible = flat.filter(
    (m) => m.visible && (!m.requiredRole || m.requiredRole === userRole)
  );
  const map = new Map<number, NavigationMenuItem>();
  visible.forEach((m) => map.set(m.id, { ...m, children: [] }));

  const roots: NavigationMenuItem[] = [];
  map.forEach((item) => {
    if (item.parentId === null) {
      roots.push(item);
    } else {
      map.get(item.parentId)?.children.push(item);
    }
  });

  const sort = (items: NavigationMenuItem[]) =>
    items.sort((a, b) => a.displayOrder - b.displayOrder);

  map.forEach((item) => sort(item.children));
  return sort(roots);
}

const fallbackNavigationMenus: NavigationMenuRecord[] = [
  {
    id: -1,
    code: "DASHBOARD",
    parentId: null,
    label: "대시보드",
    labelKey: "nav.dashboard",
    path: "/dashboard",
    icon: "LayoutDashboard",
    isExternal: false,
    requiredRole: null,
    requiredPermission: null,
    visible: true,
    displayOrder: 0,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -2,
    code: "ADMIN",
    parentId: null,
    label: "관리",
    labelKey: "nav.admin",
    path: null,
    icon: "Settings",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 1,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -3,
    code: "ADMIN_OPERATIONS",
    parentId: -2,
    label: "운영 관리",
    labelKey: null,
    path: null,
    icon: "ClipboardList",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 0,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -4,
    code: "ADMIN_DASHBOARD",
    parentId: -3,
    label: "대시보드",
    labelKey: "nav.dashboard",
    path: "/dashboard",
    icon: "LayoutDashboard",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 0,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -5,
    code: "ADMIN_ORDERS",
    parentId: -3,
    label: "주문 관리",
    labelKey: null,
    path: "/orders",
    icon: "ClipboardList",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 1,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -6,
    code: "ADMIN_KITCHEN",
    parentId: -3,
    label: "주방 현황",
    labelKey: null,
    path: "/kitchen-board",
    icon: "Utensils",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 2,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -7,
    code: "ADMIN_SALES",
    parentId: -3,
    label: "매출 관리",
    labelKey: null,
    path: "/sales",
    icon: "BarChart3",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 3,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -8,
    code: "ADMIN_PRODUCTS",
    parentId: -2,
    label: "상품 관리",
    labelKey: null,
    path: null,
    icon: "ShoppingBag",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 1,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -9,
    code: "ADMIN_SALE_MENUS",
    parentId: -8,
    label: "판매 메뉴 관리",
    labelKey: null,
    path: "/sale-menus",
    icon: "ShoppingBag",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 0,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -10,
    code: "ADMIN_SALE_MENU_SETS",
    parentId: -8,
    label: "세트 메뉴 관리",
    labelKey: null,
    path: "/sale-menu-sets",
    icon: "Package",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 1,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -11,
    code: "ADMIN_SALE_MENU_CATEGORIES",
    parentId: -8,
    label: "카테고리 관리",
    labelKey: null,
    path: "/sale-menu-categories",
    icon: "Package",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 2,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -12,
    code: "ADMIN_SALE_MENU_AVAILABILITY",
    parentId: -8,
    label: "품절/노출 관리",
    labelKey: null,
    path: "/sale-menu-availability",
    icon: "Eye",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 3,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -13,
    code: "ADMIN_PEOPLE",
    parentId: -2,
    label: "사람·권한",
    labelKey: null,
    path: null,
    icon: "Users",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 2,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -14,
    code: "ADMIN_USERS",
    parentId: -13,
    label: "유저 관리",
    labelKey: "nav.users",
    path: "/users",
    icon: "Users",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 0,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -15,
    code: "ADMIN_ROLES",
    parentId: -13,
    label: "롤 관리",
    labelKey: "nav.roleManagement",
    path: "/roles",
    icon: "Shield",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 1,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -16,
    code: "ADMIN_ROLE_PERMISSIONS",
    parentId: -13,
    label: "역할-권한 매핑",
    labelKey: "nav.rolePermissions",
    path: "/role-permissions",
    icon: "ShieldCheck",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 2,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -17,
    code: "ADMIN_SETTINGS",
    parentId: -2,
    label: "설정",
    labelKey: null,
    path: null,
    icon: "Settings",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 3,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -18,
    code: "ADMIN_SITE_SETTINGS",
    parentId: -17,
    label: "매장 설정",
    labelKey: "nav.siteSettings",
    path: "/site-settings",
    icon: "Store",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 0,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -19,
    code: "ADMIN_SCREEN_SETTINGS",
    parentId: -17,
    label: "화면 설정",
    labelKey: null,
    path: "/screen-settings",
    icon: "MonitorCog",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 1,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -20,
    code: "ADMIN_NAVIGATION_MENU_MANAGEMENT",
    parentId: -17,
    label: "내비게이션 메뉴 관리",
    labelKey: "nav.menuManagement",
    path: "/navigation-menus",
    icon: "Menu",
    isExternal: false,
    requiredRole: "ROLE_ADMIN",
    requiredPermission: null,
    visible: true,
    displayOrder: 2,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: -100,
    code: "GUIDE",
    parentId: null,
    label: "사용 가이드",
    labelKey: "nav.guide",
    path: "/guide",
    icon: "BookOpen",
    isExternal: false,
    requiredRole: null,
    requiredPermission: null,
    visible: true,
    displayOrder: 99,
    createdAt: "",
    updatedAt: "",
  },
];

const adminMenuMeta: Record<string, { description: string; icon: LucideIcon }> = {
  ADMIN_DASHBOARD: { description: "주문, 매출, 운영 상태를 한 화면에서 확인합니다.", icon: LayoutDashboard },
  ADMIN_ORDERS: { description: "접수된 주문과 결제 상태를 관리합니다.", icon: ClipboardList },
  ADMIN_KITCHEN: { description: "주방 접수와 조리 진행 상태를 확인합니다.", icon: Utensils },
  ADMIN_SALES: { description: "일별 매출과 결제 흐름을 확인합니다.", icon: BarChart3 },
  ADMIN_SALE_MENUS: { description: "키오스크에서 판매할 메뉴와 가격을 관리합니다.", icon: ShoppingBag },
  ADMIN_SALE_MENU_SETS: { description: "세트 상품과 포함 단품 구성을 관리합니다.", icon: Package },
  ADMIN_SALE_MENU_CATEGORIES: { description: "판매 메뉴 카테고리와 노출 순서를 정리합니다.", icon: Package },
  ADMIN_SALE_MENU_AVAILABILITY: { description: "품절, 숨김, 매장/포장 노출 상태를 조정합니다.", icon: Eye },
  ADMIN_USERS: { description: "회원과 고객 계정을 확인하고 역할을 조정합니다.", icon: Users },
  ADMIN_ROLES: { description: "시스템 롤과 커스텀 롤을 관리합니다.", icon: BadgeCheck },
  ADMIN_ROLE_PERMISSIONS: { description: "역할별 접근 권한을 매핑합니다.", icon: ShieldCheck },
  ADMIN_SITE_SETTINGS: { description: "메인 화면과 매장 소개 설정을 편집합니다.", icon: MonitorCog },
  ADMIN_NAVIGATION_MENU_MANAGEMENT: { description: "상단 헤더 메뉴와 노출 구성을 조정합니다.", icon: Menu },
};

function flattenLeaves(item: NavigationMenuItem): NavigationMenuItem[] {
  if (item.children.length === 0) return item.path ? [item] : [];
  return item.children.flatMap(flattenLeaves);
}

function AdminMegaMenu({ item }: { item: NavigationMenuItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const leaves = flattenLeaves(item);
  const isActive = leaves.some((leaf) => leaf.path && pathname.startsWith(leaf.path));
  const groups =
    item.children.some((child) => child.children.length > 0)
      ? item.children
      : [{ ...item, id: -1, label: "관리", children: item.children }];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors ${
          isActive || open
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        {item.label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),1120px)] overflow-hidden rounded-lg border border-border bg-background p-4 shadow-xl">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {groups.map((group) => {
                const children = group.children.filter((child) => child.path || child.children.length > 0);
                if (children.length === 0) return null;

                return (
                  <div key={group.id} className="rounded-lg border border-border bg-muted/20 p-3">
                    <h4 className="text-sm font-bold tracking-tight">{group.label}</h4>
                    <div className="mt-3 space-y-1.5">
                      {children.flatMap((child) =>
                        child.children.length > 0 ? child.children : [child]
                      ).map((child) => {
                        const meta = adminMenuMeta[child.code] ?? {
                          description: "관리 기능으로 이동합니다.",
                          icon: Settings,
                        };
                        const Icon = meta.icon;

                        return (
                          <Link
                            key={child.id}
                            href={child.path ?? "#"}
                            target={child.isExternal ? "_blank" : undefined}
                            rel={child.isExternal ? "noopener noreferrer" : undefined}
                            onClick={() => setOpen(false)}
                            className="group flex gap-3 rounded-md border border-transparent bg-background p-2.5 transition-colors hover:border-primary hover:bg-accent"
                          >
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-foreground">
                                {child.label}
                              </span>
                              <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                                {meta.description}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </section>
        </div>
      )}
    </div>
  );
}

function DropdownMenu({ item }: { item: NavigationMenuItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isActive = item.children.some(
    (c) => c.path && pathname.startsWith(c.path)
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-9 items-center gap-1 border-b-2 px-1 text-sm transition-colors ${
          isActive
            ? "border-primary text-foreground font-medium"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        {item.label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-44 rounded-md border border-border bg-background shadow-lg z-50 py-1 overflow-hidden">
          {item.children.map((child) => (
            <Link
              key={child.id}
              href={child.path ?? "#"}
              target={child.isExternal ? "_blank" : undefined}
              rel={child.isExternal ? "noopener noreferrer" : undefined}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function NavItem({ item }: { item: NavigationMenuItem; key?: React.Key }) {
  if (item.children.length > 0) {
    if (item.code === "ADMIN") {
      return <AdminMegaMenu item={item} />;
    }
    return <DropdownMenu item={item} />;
  }
  return (
    <NavLink href={item.path ?? "#"} exact={item.path === "/dashboard"}>
      {item.label}
    </NavLink>
  );
}

function UserAvatar({ name }: { name: string }) {
  const initials = (name ?? "?").slice(0, 2).toUpperCase();
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-[10px] font-bold select-none">
      {initials}
    </span>
  );
}

function UserDropdown({
  displayName,
  user,
  onLogout,
}: {
  displayName: string;
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  onLogout: () => void;
}) {
  const { t } = useTranslation("nav");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-2.5 transition-colors hover:bg-accent"
      >
        <UserAvatar name={displayName} />
        <span className="text-sm font-medium leading-none text-foreground">
          {displayName}
        </span>
        {user.role && (
          <>
            <span className="h-3.5 w-px bg-border/80" />
            <RoleBadge role={user.role} />
          </>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-md border border-border bg-background shadow-lg z-50 py-1 overflow-hidden">
          <div className="border-b border-border px-3 py-2.5">
            <div className="flex items-center gap-2">
              <UserAvatar name={displayName} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            {user.role && <div className="mt-2"><RoleBadge role={user.role} /></div>}
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <UserCircle className="h-4 w-4" />
            {t("profile")}
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { t } = useTranslation("nav");
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [tableName, setTableName] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const syncTableName = () => setTableName(tableSessionStorage.getTableName());
    syncTableName();
    return tableSessionStorage.subscribe(syncTableName);
  }, []);

  const handleTablePick = (next: string) => {
    tableSessionStorage.setTableName(next);
  };

  const userRole = user?.role?.code ?? null;

  const { data: flatMenus = [] } = useQuery({
    queryKey: ["navigation-menus"],
    queryFn: navigationMenuApi.getAll,
    staleTime: 1000 * 60 * 5,
  });

  const { data: siteSetting } = useQuery({
    queryKey: ["site-settings"],
    queryFn: siteSettingApi.get,
    staleTime: 1000 * 10,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const tree = buildTree(flatMenus, userRole);
  const navTree =
    status === "authenticated" && tree.length === 0
      ? buildTree(fallbackNavigationMenus, userRole)
      : tree;

  const handleLogout = async () => {
    await authActions.logout();
    router.replace("/login");
  };

  const displayName = user?.username ?? user?.email ?? "?";
  const hideKioskHeader =
    pathname.startsWith("/customer") && siteSetting?.headerNavVisible === false;

  if (hideKioskHeader) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="flex h-14 w-full items-center justify-between px-4">
        <nav className="flex min-w-0 items-center gap-5">
          <Link
            href="/"
            className="mr-2 text-sm font-semibold tracking-tight hover:opacity-80 transition-opacity"
          >
            RestaurantBook
          </Link>
          {status === "authenticated" &&
            navTree.map((item) => <NavItem key={item.id} item={item} />)}
        </nav>

        <div className="flex items-center gap-2">
          {status === "authenticated" && tableName && (
            <div className="inline-flex items-center">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                aria-label="테이블 변경"
                title="테이블 변경"
                className="inline-flex h-9 max-w-[180px] items-center gap-1.5 rounded-l-md border border-r-0 border-border bg-muted px-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{tableName}</span>
              </button>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                aria-label="전체 테이블 목록에서 선택"
                title="전체 테이블 목록에서 선택"
                className="inline-flex h-9 w-9 items-center justify-center rounded-r-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          )}
          <LanguageSelect />
          <ThemeSwitcher />
          {status === "authenticated" && (
            <Link
              href="/guide"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">{t("guide")}</span>
            </Link>
          )}
          {status === "authenticated" ? (
            user && <UserDropdown displayName={displayName} user={user} onLogout={handleLogout} />
          ) : status === "anonymous" ? (
            <>
              <Link
                href="/register"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-foreground transition-colors hover:bg-accent"
              >
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <span className="hidden sm:inline text-sm font-medium leading-none">
                  {t("register")}
                </span>
              </Link>
              <Link
                href="/login"
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-primary-foreground transition-opacity hover:opacity-90"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium leading-none">
                  {t("login")}
                </span>
              </Link>
            </>
          ) : null}
        </div>
      </div>
      <TablePickerDialog
        open={pickerOpen}
        currentTableName={tableName}
        onSelect={handleTablePick}
        onClose={() => setPickerOpen(false)}
      />
    </header>
  );
}
