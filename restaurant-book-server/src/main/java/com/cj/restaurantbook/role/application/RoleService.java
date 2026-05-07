package com.cj.restaurantbook.role.application;

import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import com.cj.restaurantbook.permission.domain.Permission;
import com.cj.restaurantbook.permission.infrastructure.PermissionRepository;
import com.cj.restaurantbook.role.domain.Role;
import com.cj.restaurantbook.role.infrastructure.RoleRepository;
import com.cj.restaurantbook.role.presentation.dto.CreateRoleRequest;
import com.cj.restaurantbook.role.presentation.dto.UpdateRoleRequest;
import com.cj.restaurantbook.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public List<Role> findAll() {
        return roleRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Role getByCode(String code) {
        return roleRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROLE_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public Role getById(Long id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROLE_NOT_FOUND));
    }

    @Transactional
    public Role create(CreateRoleRequest req) {
        if (roleRepository.existsByCode(req.code())) {
            throw new BusinessException(ErrorCode.ROLE_CODE_DUPLICATE);
        }
        return roleRepository.save(Role.create(req.code(), req.name(), req.description(), false));
    }

    @Transactional
    public Role update(Long id, UpdateRoleRequest req) {
        Role role = getById(id);
        if (role.isSystemRole()) {
            throw new BusinessException(ErrorCode.ROLE_SYSTEM_READONLY);
        }
        role.rename(req.name(), req.description());
        return role;
    }

    @Transactional
    public void delete(Long id) {
        Role role = getById(id);
        if (userRepository.existsByRoleId(id)) {
            throw new BusinessException(ErrorCode.ROLE_IN_USE);
        }
        roleRepository.delete(role);
    }

    @Transactional(readOnly = true)
    public Role getRoleWithPermissions(Long id) {
        return roleRepository.findByIdWithPermissions(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROLE_NOT_FOUND));
    }

    @Transactional
    public Role setPermissions(Long roleId, List<Long> permissionIds) {
        Role role = getById(roleId);
        Set<Permission> permissions = new HashSet<>(permissionRepository.findAllById(permissionIds));
        role.setPermissions(permissions);
        return role;
    }
}
