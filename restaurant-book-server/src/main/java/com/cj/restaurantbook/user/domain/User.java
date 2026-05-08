package com.cj.restaurantbook.user.domain;

import com.cj.restaurantbook.auth.domain.AuthAccount;
import com.cj.restaurantbook.auth.domain.AuthProviderType;
import com.cj.restaurantbook.role.domain.Role;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.util.ArrayList;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(nullable = false)
    private boolean active;

    @Column(length = 1000)
    private String profileImageUrl;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AuthAccount> authAccounts = new ArrayList<>();

    public static User createNewUser(String username, Role defaultRole) {
        User u = new User();
        u.username = username;
        u.role = defaultRole;
        u.active = true;
        return u;
    }

    public void deactivate() { this.active = false; }
    public void activate()   { this.active = true; }
    public void changeRole(Role newRole) { this.role = newRole; }
    public void toggleActive() { this.active = !this.active; }

    public void updateProfile(String username) {
        this.username = username;
    }

    public void updateProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public void addAuthAccount(AuthAccount authAccount) {
        if (!authAccounts.contains(authAccount)) {
            authAccounts.add(authAccount);
        }
    }

    public String getEmail() {
        return authAccounts.stream()
                .filter(account -> account.getProviderType() == AuthProviderType.EMAIL)
                .map(AuthAccount::getIdentifier)
                .findFirst()
                .orElse(null);
    }
}
