package com.cj.restaurantbook.config;

import com.cj.restaurantbook.navigation_menu.domain.NavigationMenu;
import com.cj.restaurantbook.navigation_menu.infrastructure.NavigationMenuRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@Order(4)
@RequiredArgsConstructor
public class NavigationMenuSeeder implements ApplicationRunner {

    private final NavigationMenuRepository navigationMenuRepository;
    private final JdbcTemplate jdbcTemplate;

    private record NavigationMenuDef(
            String code, String parentCode, String label, String labelKey,
            String path, String icon, String requiredRole, int displayOrder
    ) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        migrateLegacyMenusIfNeeded();
        normalizeLegacyNavigationMenuCodes();

        List<NavigationMenuDef> defs = List.of(
                new NavigationMenuDef("DASHBOARD",             null,    "대시보드",      "nav.dashboard",        "/dashboard",        "LayoutDashboard", null,                    0),
                new NavigationMenuDef("ADMIN",                 null,    "관리",          "nav.admin",            null,                "Settings",        RoleSeeder.ROLE_ADMIN,   1),

                new NavigationMenuDef("ADMIN_OPERATIONS",      "ADMIN", "운영 관리",     null,                   null,                "ClipboardList",   RoleSeeder.ROLE_ADMIN,   0),
                new NavigationMenuDef("ADMIN_DASHBOARD",       "ADMIN_OPERATIONS", "대시보드", "nav.dashboard",    "/dashboard",        "LayoutDashboard", RoleSeeder.ROLE_ADMIN,   0),
                new NavigationMenuDef("ADMIN_ORDERS",          "ADMIN_OPERATIONS", "주문 관리", null,              "/orders",           "ClipboardList",   RoleSeeder.ROLE_ADMIN,   1),
                new NavigationMenuDef("ADMIN_KITCHEN",         "ADMIN_OPERATIONS", "주방 현황", null,              "/kitchen-board",    "Utensils",        RoleSeeder.ROLE_ADMIN,   2),
                new NavigationMenuDef("ADMIN_SALES",           "ADMIN_OPERATIONS", "매출 관리", null,              "/sales",            "BarChart3",       RoleSeeder.ROLE_ADMIN,   3),

                new NavigationMenuDef("ADMIN_PRODUCTS",        "ADMIN", "상품 관리",     null,                   null,                "ShoppingBag",     RoleSeeder.ROLE_ADMIN,   1),
                new NavigationMenuDef("ADMIN_SALE_MENUS",      "ADMIN_PRODUCTS", "판매 메뉴 관리", null,            "/sale-menus",       "ShoppingBag",     RoleSeeder.ROLE_ADMIN,   0),
                new NavigationMenuDef("ADMIN_SALE_MENU_SETS",   "ADMIN_PRODUCTS", "세트 메뉴 관리", null,          "/sale-menu-sets",    "Package",        RoleSeeder.ROLE_ADMIN,   1),
                new NavigationMenuDef("ADMIN_SALE_MENU_CATEGORIES", "ADMIN_PRODUCTS", "카테고리 관리", null,      "/sale-menu-categories", "Package",      RoleSeeder.ROLE_ADMIN,   2),
                new NavigationMenuDef("ADMIN_SALE_MENU_AVAILABILITY", "ADMIN_PRODUCTS", "품절/노출 관리", null,   "/sale-menu-availability", "Eye",        RoleSeeder.ROLE_ADMIN,   3),

                new NavigationMenuDef("ADMIN_PEOPLE",          "ADMIN", "사람·권한",     null,                   null,                "Users",           RoleSeeder.ROLE_ADMIN,   2),
                new NavigationMenuDef("ADMIN_USERS",           "ADMIN_PEOPLE", "유저 관리", "nav.users",          "/users",            "Users",           RoleSeeder.ROLE_ADMIN,   0),
                new NavigationMenuDef("ADMIN_ROLES",           "ADMIN_PEOPLE", "롤 관리", "nav.roleManagement",  "/roles",            "Shield",          RoleSeeder.ROLE_ADMIN,   1),
                new NavigationMenuDef("ADMIN_ROLE_PERMISSIONS","ADMIN_PEOPLE", "역할-권한 매핑","nav.rolePermissions", "/role-permissions", "ShieldCheck", RoleSeeder.ROLE_ADMIN,   2),

                new NavigationMenuDef("ADMIN_SETTINGS",        "ADMIN", "설정",          null,                   null,                "Settings",        RoleSeeder.ROLE_ADMIN,   3),
                new NavigationMenuDef("ADMIN_SITE_SETTINGS",   "ADMIN_SETTINGS", "매장 설정", "nav.siteSettings", "/site-settings",    "Store",           RoleSeeder.ROLE_ADMIN,   0),
                new NavigationMenuDef("ADMIN_SCREEN_SETTINGS", "ADMIN_SETTINGS", "화면 설정", null,                "/screen-settings",  "MonitorCog",      RoleSeeder.ROLE_ADMIN,   1),
                new NavigationMenuDef("ADMIN_NAVIGATION_MENU_MANAGEMENT", "ADMIN_SETTINGS", "내비게이션 메뉴 관리", "nav.menuManagement", "/navigation-menus", "Menu",       RoleSeeder.ROLE_ADMIN,   2)
        );

        for (NavigationMenuDef def : defs) {
            NavigationMenu parent = def.parentCode() != null
                    ? navigationMenuRepository.findByCode(def.parentCode()).orElse(null)
                    : null;
            navigationMenuRepository.findByCode(def.code()).ifPresentOrElse(
                    existing -> existing.update(
                            parent, def.label(), def.labelKey(),
                            def.path(), def.icon(), false,
                            def.requiredRole(), null, true, def.displayOrder()
                    ),
                    () -> {
                        navigationMenuRepository.save(NavigationMenu.create(
                                def.code(), parent, def.label(), def.labelKey(),
                                def.path(), def.icon(), false,
                                def.requiredRole(), null, true, def.displayOrder()
                        ));
                        log.info("Seeded navigation menu: {}", def.code());
                    }
            );
        }
    }

    private void migrateLegacyMenusIfNeeded() {
        Integer legacyCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = current_schema()
                  AND table_name = 'menus'
                """, Integer.class);
        if (legacyCount == null || legacyCount == 0 || navigationMenuRepository.count() > 0) {
            return;
        }

        Integer copiedCount = jdbcTemplate.update("""
                INSERT INTO navigation_menus (
                    id, code, parent_id, label, label_key, path, icon, is_external,
                    required_role, required_permission, visible, display_order, created_at, updated_at
                )
                SELECT
                    id, code, parent_id, label, label_key, path, icon, is_external,
                    required_role, required_permission, visible, display_order, created_at, updated_at
                FROM menus
                """);
        jdbcTemplate.execute("""
                SELECT setval(
                    pg_get_serial_sequence('navigation_menus', 'id'),
                    COALESCE((SELECT MAX(id) FROM navigation_menus), 1),
                    (SELECT COUNT(*) FROM navigation_menus) > 0
                )
                """);
        log.info("Migrated legacy menus to navigation_menus: {}", copiedCount);
    }

    private void normalizeLegacyNavigationMenuCodes() {
        jdbcTemplate.update("""
                DELETE FROM navigation_menus
                WHERE code = 'ADMIN_MENU_MANAGEMENT'
                  AND EXISTS (
                      SELECT 1
                      FROM navigation_menus
                      WHERE code = 'ADMIN_NAVIGATION_MENU_MANAGEMENT'
                  )
                """);
        jdbcTemplate.update("""
                UPDATE navigation_menus
                SET code = 'ADMIN_NAVIGATION_MENU_MANAGEMENT',
                    label = '내비게이션 메뉴 관리',
                    path = '/navigation-menus'
                WHERE code = 'ADMIN_MENU_MANAGEMENT'
                """);
    }
}
