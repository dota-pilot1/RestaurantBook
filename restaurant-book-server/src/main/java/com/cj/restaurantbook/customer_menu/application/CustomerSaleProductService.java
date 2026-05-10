package com.cj.restaurantbook.customer_menu.application;

import com.cj.restaurantbook.customer_menu.domain.CustomerOrderType;
import com.cj.restaurantbook.customer_menu.domain.SaleProductSection;
import com.cj.restaurantbook.customer_menu.presentation.dto.CustomerSaleProductResponse;
import com.cj.restaurantbook.sale_menu.domain.SaleMenuStatus;
import com.cj.restaurantbook.sale_menu.infrastructure.SaleMenuRepository;
import com.cj.restaurantbook.sale_menu_set.infrastructure.SaleMenuSetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class CustomerSaleProductService {

    private static final List<SaleMenuStatus> CUSTOMER_VISIBLE_STATUSES = List.of(
            SaleMenuStatus.ACTIVE,
            SaleMenuStatus.SOLD_OUT
    );

    private final SaleMenuRepository saleMenuRepository;
    private final SaleMenuSetRepository saleMenuSetRepository;

    @Transactional(readOnly = true)
    public List<CustomerSaleProductResponse> findProducts(
            CustomerOrderType orderType,
            SaleProductSection section,
            Long categoryId
    ) {
        CustomerOrderType resolvedOrderType = orderType == null ? CustomerOrderType.DINE_IN : orderType;
        SaleProductSection resolvedSection = section == null ? SaleProductSection.ALL : section;
        boolean dineIn = resolvedOrderType == CustomerOrderType.DINE_IN;
        boolean takeout = resolvedOrderType == CustomerOrderType.TAKEOUT;

        if (resolvedSection == SaleProductSection.SET) {
            return saleMenuSetRepository.findCustomerSaleMenuSets(CUSTOMER_VISIBLE_STATUSES, dineIn, takeout)
                    .stream()
                    .map(CustomerSaleProductResponse::fromSaleMenuSet)
                    .toList();
        }

        Stream<CustomerSaleProductResponse> menus = saleMenuRepository
                .findCustomerSaleMenus(CUSTOMER_VISIBLE_STATUSES, dineIn, takeout, categoryId)
                .stream()
                .map(CustomerSaleProductResponse::fromSaleMenu);

        if (resolvedSection == SaleProductSection.MENU) {
            return menus.toList();
        }

        Stream<CustomerSaleProductResponse> sets = saleMenuSetRepository
                .findCustomerSaleMenuSets(CUSTOMER_VISIBLE_STATUSES, dineIn, takeout)
                .stream()
                .map(CustomerSaleProductResponse::fromSaleMenuSet);

        return Stream.concat(menus, sets).toList();
    }
}
