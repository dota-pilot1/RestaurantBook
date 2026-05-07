package com.cj.restaurantbook.user.application;

import com.cj.restaurantbook.auth.application.EmailVerificationService;
import com.cj.restaurantbook.auth.domain.AuthAccount;
import com.cj.restaurantbook.auth.domain.AuthProviderType;
import com.cj.restaurantbook.auth.domain.RefreshToken;
import com.cj.restaurantbook.auth.infrastructure.AuthAccountRepository;
import com.cj.restaurantbook.auth.infrastructure.RefreshTokenRepository;
import com.cj.restaurantbook.auth.jwt.JwtTokenProvider;
import com.cj.restaurantbook.auth.jwt.TokenType;
import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.DuplicateEmailException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import com.cj.restaurantbook.common.exception.InvalidRefreshTokenException;
import com.cj.restaurantbook.role.domain.Role;
import com.cj.restaurantbook.role.infrastructure.RoleRepository;
import com.cj.restaurantbook.user.domain.User;
import com.cj.restaurantbook.user.infrastructure.UserRepository;
import com.cj.restaurantbook.user.presentation.dto.*;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AuthAccountRepository authAccountRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailVerificationService emailVerificationService;

    @Value("${auth.signup.default-role:ROLE_CUSTOMER}")
    private String signupDefaultRole;

    @Transactional
    public TokenResponse signup(SignupRequest req) {
        String email = emailVerificationService.normalizeEmail(req.email());
        verifySignupToken(email, req.verifiedToken());
        if (authAccountRepository.existsByProviderTypeAndIdentifier(AuthProviderType.EMAIL, email)) {
            throw new DuplicateEmailException();
        }
        Role defaultRole = roleRepository.findByCode(signupDefaultRole)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROLE_NOT_FOUND));
        String hash = passwordEncoder.encode(req.password());
        User saved = userRepository.save(User.createNewUser(req.username(), defaultRole));
        authAccountRepository.save(AuthAccount.createEmail(saved, email, hash, true));
        return issueTokens(saved, email);
    }

    @Transactional(readOnly = true)
    public boolean isEmailAvailable(String email) {
        String normalizedEmail = emailVerificationService.normalizeEmail(email);
        return !authAccountRepository.existsByProviderTypeAndIdentifier(AuthProviderType.EMAIL, normalizedEmail);
    }

    @Transactional
    public TokenResponse login(LoginRequest req) {
        String email = emailVerificationService.normalizeEmail(req.email());
        AuthAccount account = authAccountRepository.findByProviderTypeAndIdentifier(AuthProviderType.EMAIL, email)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));
        if (account.getPasswordHash() == null || !passwordEncoder.matches(req.password(), account.getPasswordHash())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }
        if (!account.isVerified()) throw new BusinessException(ErrorCode.EMAIL_NOT_VERIFIED);
        User user = account.getUser();
        if (!user.isActive()) throw new BusinessException(ErrorCode.ACCOUNT_INACTIVE);
        return issueTokens(user, account.getIdentifier());
    }

    @Transactional
    public TokenResponse refresh(RefreshRequest req) {
        Claims claims;
        try {
            claims = jwtTokenProvider.parse(req.refreshToken()).getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            throw new InvalidRefreshTokenException();
        }
        if (jwtTokenProvider.getType(claims) != TokenType.REFRESH) {
            throw new InvalidRefreshTokenException();
        }
        Long userId = jwtTokenProvider.getUserId(claims);

        RefreshToken saved = refreshTokenRepository.findByUserId(userId)
                .orElseThrow(InvalidRefreshTokenException::new);

        if (!saved.getToken().equals(req.refreshToken()) || saved.isExpired()) {
            refreshTokenRepository.deleteByUserId(userId);
            throw new InvalidRefreshTokenException();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!user.isActive()) throw new BusinessException(ErrorCode.ACCOUNT_INACTIVE);

        return issueTokens(user, findEmailIdentifier(user));
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    @Transactional(readOnly = true)
    public UserSummary me(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return UserSummary.from(user, findEmailIdentifier(user));
    }

    private TokenResponse issueTokens(User user, String email) {
        List<String> permCodes = user.getRole().getPermissions()
                .stream().map(p -> p.getCode()).toList();
        String access  = jwtTokenProvider.generateAccessToken(user.getId(), email, user.getUsername(), user.getRole().getCode(), permCodes);
        String refresh = jwtTokenProvider.generateRefreshToken(user.getId());
        Instant expiresAt = Instant.now().plusMillis(jwtTokenProvider.getRefreshTokenExpirationMs());

        refreshTokenRepository.findByUserId(user.getId()).ifPresentOrElse(
                rt -> rt.rotate(refresh, expiresAt),
                () -> refreshTokenRepository.save(RefreshToken.create(user.getId(), refresh, expiresAt))
        );

        long expiresInSec = jwtTokenProvider.getAccessTokenExpirationMs() / 1000;
        return new TokenResponse(access, refresh, expiresInSec, UserSummary.from(user, email));
    }

    private String findEmailIdentifier(User user) {
        return authAccountRepository.findFirstByUserIdAndProviderTypeOrderByIdAsc(user.getId(), AuthProviderType.EMAIL)
                .map(AuthAccount::getIdentifier)
                .orElse(null);
    }

    private void verifySignupToken(String email, String verifiedToken) {
        Claims claims;
        try {
            claims = jwtTokenProvider.parse(verifiedToken).getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.EMAIL_NOT_VERIFIED);
        }
        if (jwtTokenProvider.getType(claims) != TokenType.EMAIL_VERIFICATION
                || jwtTokenProvider.getProviderType(claims) != AuthProviderType.EMAIL
                || !email.equals(jwtTokenProvider.getIdentifier(claims))) {
            throw new BusinessException(ErrorCode.EMAIL_NOT_VERIFIED);
        }
    }
}
