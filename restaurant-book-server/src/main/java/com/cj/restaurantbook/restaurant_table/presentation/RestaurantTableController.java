package com.cj.restaurantbook.restaurant_table.presentation;

import com.cj.restaurantbook.restaurant_table.application.RestaurantTableService;
import com.cj.restaurantbook.restaurant_table.presentation.dto.CreateRestaurantTableRequest;
import com.cj.restaurantbook.restaurant_table.presentation.dto.RestaurantTableResponse;
import com.cj.restaurantbook.restaurant_table.presentation.dto.UpdateRestaurantTableRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "테이블 관리")
@RestController
@RequestMapping("/api/tables")
@RequiredArgsConstructor
public class RestaurantTableController {

    private final RestaurantTableService service;

    @GetMapping
    public List<RestaurantTableResponse> list() {
        return service.findAll();
    }

    @GetMapping("/active")
    public List<RestaurantTableResponse> listActive() {
        return service.findAllActive();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public RestaurantTableResponse create(@Valid @RequestBody CreateRestaurantTableRequest req) {
        return service.create(req);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public RestaurantTableResponse update(@PathVariable Long id,
                                          @Valid @RequestBody UpdateRestaurantTableRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
