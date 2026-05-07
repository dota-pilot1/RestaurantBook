package com.cj.restaurantbook.config;

import com.cj.restaurantbook.role.domain.Role;
import com.cj.restaurantbook.role.infrastructure.RoleRepository;
import com.cj.restaurantbook.user.domain.User;
import com.cj.restaurantbook.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class RoleSeeder implements ApplicationRunner {

    public static final String ROLE_ADMIN = "ROLE_ADMIN";
    public static final String ROLE_MANAGER = "ROLE_MANAGER";
    public static final String ROLE_KITCHEN = "ROLE_KITCHEN";
    public static final String ROLE_STAFF = "ROLE_STAFF";
    public static final String ROLE_CUSTOMER = "ROLE_CUSTOMER";
    private static final String LEGACY_ROLE_USER = "ROLE_USER";

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    private record RoleDef(String code, String name, String description) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<RoleDef> defaults = List.of(
                new RoleDef(ROLE_ADMIN, "관리자", "시스템 전체 관리자"),
                new RoleDef(ROLE_MANAGER, "매니저", "매장 및 쇼핑몰 운영 관리자"),
                new RoleDef(ROLE_KITCHEN, "주방", "주방 주문 접수 및 조리 상태 관리자"),
                new RoleDef(ROLE_STAFF, "직원", "매장 주문 및 현장 운영 담당자"),
                new RoleDef(ROLE_CUSTOMER, "고객", "쇼핑몰 주문 고객")
        );
        for (RoleDef def : defaults) {
            if (!roleRepository.existsByCode(def.code())) {
                roleRepository.save(Role.create(def.code(), def.name(), def.description(), true));
                log.info("Seeded role: {} ({})", def.code(), def.name());
            }
        }

        migrateLegacyUserRole();
    }

    private void migrateLegacyUserRole() {
        Role legacyRole = roleRepository.findByCode(LEGACY_ROLE_USER).orElse(null);
        if (legacyRole == null) return;

        Role customerRole = roleRepository.findByCode(ROLE_CUSTOMER)
                .orElseThrow(() -> new IllegalStateException("Default role not found: " + ROLE_CUSTOMER));

        List<User> legacyUsers = userRepository.findByRoleCode(LEGACY_ROLE_USER);
        for (User user : legacyUsers) {
            user.changeRole(customerRole);
        }
        if (!legacyUsers.isEmpty()) {
            log.info("Migrated {} users from {} to {}", legacyUsers.size(), LEGACY_ROLE_USER, ROLE_CUSTOMER);
        }

        if (!userRepository.existsByRoleId(legacyRole.getId())) {
            roleRepository.delete(legacyRole);
            log.info("Deleted legacy role: {}", LEGACY_ROLE_USER);
        }
    }
}
