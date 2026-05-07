package com.cj.restaurantbook.navigation_menu.application;

import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import com.cj.restaurantbook.navigation_menu.infrastructure.NavigationMenuRepository;
import com.cj.restaurantbook.navigation_menu.domain.NavigationMenu;
import com.cj.restaurantbook.navigation_menu.presentation.dto.CreateNavigationMenuRequest;
import com.cj.restaurantbook.navigation_menu.presentation.dto.NavigationMenuResponse;
import com.cj.restaurantbook.navigation_menu.presentation.dto.UpdateNavigationMenuRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NavigationMenuService {

    private final NavigationMenuRepository navigationMenuRepository;

    @Transactional(readOnly = true)
    public List<NavigationMenuResponse> getAll() {
        return navigationMenuRepository.findAllOrderByDisplayOrder()
                .stream()
                .map(NavigationMenuResponse::from)
                .toList();
    }

    @Transactional
    public NavigationMenuResponse create(CreateNavigationMenuRequest req) {
        if (navigationMenuRepository.existsByCode(req.code())) {
            throw new BusinessException(ErrorCode.NAVIGATION_MENU_CODE_DUPLICATE);
        }
        NavigationMenu parent = resolveParent(req.parentId());
        NavigationMenu navigationMenu = NavigationMenu.create(
                req.code(), parent, req.label(), req.labelKey(),
                req.path(), req.icon(), req.isExternal(),
                req.requiredRole(), req.requiredPermission(),
                req.visible(), req.displayOrder()
        );
        return NavigationMenuResponse.from(navigationMenuRepository.save(navigationMenu));
    }

    @Transactional
    public NavigationMenuResponse update(Long id, UpdateNavigationMenuRequest req) {
        NavigationMenu navigationMenu = getById(id);
        NavigationMenu parent = resolveParent(req.parentId());
        navigationMenu.update(
                parent, req.label(), req.labelKey(),
                req.path(), req.icon(), req.isExternal(),
                req.requiredRole(), req.requiredPermission(),
                req.visible(), req.displayOrder()
        );
        return NavigationMenuResponse.from(navigationMenu);
    }

    @Transactional
    public void delete(Long id) {
        NavigationMenu navigationMenu = getById(id);
        navigationMenuRepository.delete(navigationMenu);
    }

    private NavigationMenu getById(Long id) {
        return navigationMenuRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NAVIGATION_MENU_NOT_FOUND));
    }

    private NavigationMenu resolveParent(Long parentId) {
        if (parentId == null) return null;
        return navigationMenuRepository.findById(parentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NAVIGATION_MENU_PARENT_NOT_FOUND));
    }
}
