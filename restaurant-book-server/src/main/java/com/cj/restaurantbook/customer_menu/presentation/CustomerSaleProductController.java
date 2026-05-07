package com.cj.restaurantbook.customer_menu.presentation;

import com.cj.restaurantbook.customer_menu.application.CustomerSaleProductService;
import com.cj.restaurantbook.customer_menu.domain.CustomerOrderType;
import com.cj.restaurantbook.customer_menu.domain.SaleProductSection;
import com.cj.restaurantbook.customer_menu.presentation.dto.CustomerSaleProductResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "고객 판매 상품 조회")
@RestController
@RequestMapping("/api/customer/sale-products")
@RequiredArgsConstructor
public class CustomerSaleProductController {

    private final CustomerSaleProductService service;

    @GetMapping
    public List<CustomerSaleProductResponse> list(@RequestParam(required = false) CustomerOrderType orderType,
                                                  @RequestParam(required = false) SaleProductSection section,
                                                  @RequestParam(required = false) Long categoryId) {
        return service.findProducts(orderType, section, categoryId);
    }
}
