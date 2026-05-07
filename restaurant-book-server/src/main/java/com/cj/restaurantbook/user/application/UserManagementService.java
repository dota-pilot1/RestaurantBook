package com.cj.restaurantbook.user.application;

import com.cj.restaurantbook.auth.domain.AuthAccount;
import com.cj.restaurantbook.auth.domain.AuthProviderType;
import com.cj.restaurantbook.auth.infrastructure.RefreshTokenRepository;
import com.cj.restaurantbook.auth.infrastructure.AuthAccountRepository;
import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.DuplicateEmailException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import com.cj.restaurantbook.role.application.RoleService;
import com.cj.restaurantbook.role.domain.Role;
import com.cj.restaurantbook.user.domain.User;
import com.cj.restaurantbook.user.infrastructure.UserRepository;
import com.cj.restaurantbook.user.presentation.dto.CreateUserRequest;
import com.cj.restaurantbook.user.presentation.dto.UpdateUserRequest;
import com.cj.restaurantbook.user.presentation.dto.UserListItemResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final AuthAccountRepository authAccountRepository;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional(readOnly = true)
    public Page<UserListItemResponse> getUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(user -> UserListItemResponse.from(user, findEmailIdentifier(user)));
    }

    @Transactional(readOnly = true)
    public UserListItemResponse getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return UserListItemResponse.from(user, findEmailIdentifier(user));
    }

    @Transactional
    public UserListItemResponse createUser(CreateUserRequest req) {
        String email = normalizeEmail(req.email());
        if (authAccountRepository.existsByProviderTypeAndIdentifier(AuthProviderType.EMAIL, email)) {
            throw new DuplicateEmailException();
        }
        Role role = roleService.getById(req.roleId());
        String hash = passwordEncoder.encode(req.password());
        User saved = userRepository.save(User.createNewUser(req.username(), role));
        authAccountRepository.save(AuthAccount.createEmail(saved, email, hash, true));
        return UserListItemResponse.from(saved, email);
    }

    @Transactional
    public UserListItemResponse updateProfile(Long userId, UpdateUserRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        String email = normalizeEmail(req.email());
        AuthAccount account = authAccountRepository.findFirstByUserIdAndProviderTypeOrderByIdAsc(userId, AuthProviderType.EMAIL)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!account.getIdentifier().equals(email)
                && authAccountRepository.existsByProviderTypeAndIdentifier(AuthProviderType.EMAIL, email)) {
            throw new DuplicateEmailException();
        }
        account.changeIdentifier(email);
        user.updateProfile(req.username());
        return UserListItemResponse.from(user, email);
    }

    @Transactional
    public UserListItemResponse changeRole(Long userId, Long roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Role newRole = roleService.getById(roleId);
        user.changeRole(newRole);
        return UserListItemResponse.from(user, findEmailIdentifier(user));
    }

    @Transactional
    public UserListItemResponse toggleActive(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.toggleActive();
        return UserListItemResponse.from(user, findEmailIdentifier(user));
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        refreshTokenRepository.deleteByUserId(userId);
        userRepository.delete(user);
    }

    private String findEmailIdentifier(User user) {
        return authAccountRepository.findFirstByUserIdAndProviderTypeOrderByIdAsc(user.getId(), AuthProviderType.EMAIL)
                .map(AuthAccount::getIdentifier)
                .orElse(null);
    }

    private String normalizeEmail(String email) {
        return email.toLowerCase(Locale.ROOT).trim();
    }
}
