package com.cj.restaurantbook.navigation_menu.presentation;

import com.cj.restaurantbook.navigation_menu.application.NavigationMenuService;
import com.cj.restaurantbook.navigation_menu.presentation.dto.CreateNavigationMenuRequest;
import com.cj.restaurantbook.navigation_menu.presentation.dto.NavigationMenuResponse;
import com.cj.restaurantbook.navigation_menu.presentation.dto.UpdateNavigationMenuRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/navigation-menus")
@RequiredArgsConstructor
@Tag(name = "NavigationMenu", description = "헤더 내비게이션 메뉴 조회 및 관리")
public class NavigationMenuController {

    private final NavigationMenuService navigationMenuService;

    @GetMapping
    @Operation(summary = "전체 메뉴 플랫 조회 (공개)")
    public List<NavigationMenuResponse> getAll() {
        return navigationMenuService.getAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "메뉴 생성 (ROLE_ADMIN)")
    public ResponseEntity<NavigationMenuResponse> create(@Valid @RequestBody CreateNavigationMenuRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(navigationMenuService.create(req));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "메뉴 수정 (ROLE_ADMIN)")
    public NavigationMenuResponse update(@PathVariable Long id, @Valid @RequestBody UpdateNavigationMenuRequest req) {
        return navigationMenuService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "메뉴 삭제 (ROLE_ADMIN)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        navigationMenuService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
