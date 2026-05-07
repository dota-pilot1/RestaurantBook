package com.cj.restaurantbook.sale_menu_category.presentation;

import com.cj.restaurantbook.sale_menu_category.application.SaleMenuCategoryService;
import com.cj.restaurantbook.sale_menu_category.presentation.dto.CreateSaleMenuCategoryRequest;
import com.cj.restaurantbook.sale_menu_category.presentation.dto.SaleMenuCategoryResponse;
import com.cj.restaurantbook.sale_menu_category.presentation.dto.UpdateSaleMenuCategoryRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "판매 메뉴 카테고리 관리")
@RestController
@RequestMapping("/api/sale-menu-categories")
@RequiredArgsConstructor
public class SaleMenuCategoryController {

    private final SaleMenuCategoryService service;

    @GetMapping
    public List<SaleMenuCategoryResponse> list() {
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public SaleMenuCategoryResponse create(@Valid @RequestBody CreateSaleMenuCategoryRequest req) {
        return service.create(req);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public SaleMenuCategoryResponse update(@PathVariable Long id,
                                           @Valid @RequestBody UpdateSaleMenuCategoryRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
