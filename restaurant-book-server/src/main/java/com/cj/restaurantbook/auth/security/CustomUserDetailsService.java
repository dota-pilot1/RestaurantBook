package com.cj.restaurantbook.auth.security;

import com.cj.restaurantbook.auth.domain.AuthProviderType;
import com.cj.restaurantbook.auth.infrastructure.AuthAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AuthAccountRepository authAccountRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        String identifier = email.toLowerCase(Locale.ROOT).trim();
        return authAccountRepository.findByProviderTypeAndIdentifier(AuthProviderType.EMAIL, identifier)
                .filter(account -> account.getPasswordHash() != null)
                .map(UserPrincipal::fromAuthAccount)
                .orElseThrow(() -> new UsernameNotFoundException("user not found: " + email));
    }
}
