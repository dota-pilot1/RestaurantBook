package com.cj.restaurantbook.permission.infrastructure;

import com.cj.restaurantbook.permission.domain.Permission;
import com.cj.restaurantbook.permission_category.domain.PermissionCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PermissionRepository extends JpaRepository<Permission, Long> {
    boolean existsByCode(String code);
    Optional<Permission> findByCode(String code);
    List<Permission> findAllByCategory(PermissionCategory category);
    boolean existsByCategory(PermissionCategory category);
}
