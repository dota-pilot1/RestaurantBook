package com.cj.restaurantbook.sale_menu_set.presentation;

import com.cj.restaurantbook.sale_menu.domain.SaleMenuStatus;
import com.cj.restaurantbook.sale_menu_set.application.SaleMenuSetService;
import com.cj.restaurantbook.sale_menu_set.presentation.dto.CreateSaleMenuSetRequest;
import com.cj.restaurantbook.sale_menu_set.presentation.dto.SaleMenuSetResponse;
import com.cj.restaurantbook.sale_menu_set.presentation.dto.UpdateSaleMenuSetRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "세트 메뉴 관리")
@RestController
@RequestMapping("/api/sale-menu-sets")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class SaleMenuSetController {

    private final SaleMenuSetService service;

    @GetMapping
    public List<SaleMenuSetResponse> list(@RequestParam(required = false) SaleMenuStatus status,
                                          @RequestParam(required = false) Boolean visible,
                                          @RequestParam(required = false) String keyword) {
        return service.findAll(status, visible, keyword);
    }

    @GetMapping("/{id}")
    public SaleMenuSetResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SaleMenuSetResponse create(@Valid @RequestBody CreateSaleMenuSetRequest req) {
        return service.create(req);
    }

    @PatchMapping("/{id}")
    public SaleMenuSetResponse update(@PathVariable Long id,
                                      @Valid @RequestBody UpdateSaleMenuSetRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
