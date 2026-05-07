package com.cj.restaurantbook.permission.presentation.dto;

import com.cj.restaurantbook.permission.domain.Permission;

public record PermissionSummary(Long id, String code, String name, String category) {
    public static PermissionSummary from(Permission p) {
        String categoryCode = p.getCategory() != null ? p.getCategory().getCode() : null;
        return new PermissionSummary(p.getId(), p.getCode(), p.getName(), categoryCode);
    }
}
