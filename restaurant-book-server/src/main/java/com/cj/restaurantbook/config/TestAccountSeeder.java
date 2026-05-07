package com.cj.restaurantbook.config;

import com.cj.restaurantbook.auth.domain.AuthAccount;
import com.cj.restaurantbook.auth.domain.AuthProviderType;
import com.cj.restaurantbook.auth.infrastructure.AuthAccountRepository;
import com.cj.restaurantbook.role.domain.Role;
import com.cj.restaurantbook.role.infrastructure.RoleRepository;
import com.cj.restaurantbook.user.domain.User;
import com.cj.restaurantbook.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@Order(5)
@RequiredArgsConstructor
public class TestAccountSeeder implements ApplicationRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final AuthAccountRepository authAccountRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.test-accounts.enabled:true}")
    private boolean enabled;

    @Value("${app.seed.test-accounts.password:password123}")
    private String password;

    @Value("${app.seed.test-accounts.email-domain:restaurantbook.local}")
    private String emailDomain;

    private record TestAccountDef(String roleCode, String username, String emailLocalPart) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled) {
            log.info("Test account seeding is disabled.");
            return;
        }

        List<TestAccountDef> defaults = List.of(
                new TestAccountDef(RoleSeeder.ROLE_ADMIN, "관리자 테스트", "admin"),
                new TestAccountDef(RoleSeeder.ROLE_MANAGER, "매니저 테스트", "manager"),
                new TestAccountDef(RoleSeeder.ROLE_KITCHEN, "주방 테스트", "kitchen"),
                new TestAccountDef(RoleSeeder.ROLE_STAFF, "직원 테스트", "staff"),
                new TestAccountDef(RoleSeeder.ROLE_CUSTOMER, "고객 테스트", "customer")
        );

        for (TestAccountDef def : defaults) {
            String email = "%s@%s".formatted(def.emailLocalPart(), emailDomain);
            if (authAccountRepository.existsByProviderTypeAndIdentifier(AuthProviderType.EMAIL, email)) {
                continue;
            }

            Role role = roleRepository.findByCode(def.roleCode())
                    .orElseThrow(() -> new IllegalStateException("Default role not found: " + def.roleCode()));
            User user = userRepository.save(User.createNewUser(def.username(), role));
            authAccountRepository.save(AuthAccount.createEmail(
                    user,
                    email,
                    passwordEncoder.encode(password),
                    true
            ));
            log.info("Seeded test account: {} ({})", email, def.roleCode());
        }
    }
}
