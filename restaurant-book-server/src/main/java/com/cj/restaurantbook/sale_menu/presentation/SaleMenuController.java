package com.cj.restaurantbook.sale_menu.presentation;

import com.cj.restaurantbook.sale_menu.application.SaleMenuService;
import com.cj.restaurantbook.sale_menu.domain.SaleMenuStatus;
import com.cj.restaurantbook.sale_menu.presentation.dto.CreateSaleMenuRequest;
import com.cj.restaurantbook.sale_menu.presentation.dto.SaleMenuResponse;
import com.cj.restaurantbook.sale_menu.presentation.dto.UpdateSaleMenuRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "판매 메뉴 관리")
@RestController
@RequestMapping("/api/sale-menus")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class SaleMenuController {

    private final SaleMenuService service;

    @GetMapping
    public List<SaleMenuResponse> list(@RequestParam(required = false) Long categoryId,
                                       @RequestParam(required = false) SaleMenuStatus status,
                                       @RequestParam(required = false) Boolean visible,
                                       @RequestParam(required = false) String keyword) {
        return service.findAll(categoryId, status, visible, keyword);
    }

    @GetMapping("/{id}")
    public SaleMenuResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SaleMenuResponse create(@Valid @RequestBody CreateSaleMenuRequest req) {
        return service.create(req);
    }

    @PatchMapping("/{id}")
    public SaleMenuResponse update(@PathVariable Long id,
                                   @Valid @RequestBody UpdateSaleMenuRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
