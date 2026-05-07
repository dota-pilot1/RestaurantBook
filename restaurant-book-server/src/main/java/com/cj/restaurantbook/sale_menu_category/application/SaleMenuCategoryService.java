package com.cj.restaurantbook.sale_menu_category.application;

import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import com.cj.restaurantbook.sale_menu.infrastructure.SaleMenuRepository;
import com.cj.restaurantbook.sale_menu_category.domain.SaleMenuCategory;
import com.cj.restaurantbook.sale_menu_category.infrastructure.SaleMenuCategoryRepository;
import com.cj.restaurantbook.sale_menu_category.presentation.dto.CreateSaleMenuCategoryRequest;
import com.cj.restaurantbook.sale_menu_category.presentation.dto.SaleMenuCategoryResponse;
import com.cj.restaurantbook.sale_menu_category.presentation.dto.UpdateSaleMenuCategoryRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SaleMenuCategoryService {

    private final SaleMenuCategoryRepository categoryRepository;
    private final SaleMenuRepository saleMenuRepository;

    @Transactional(readOnly = true)
    public List<SaleMenuCategoryResponse> findAll() {
        return categoryRepository.findAllOrderByDisplayOrder()
                .stream()
                .map(SaleMenuCategoryResponse::from)
                .toList();
    }

    @Transactional
    public SaleMenuCategoryResponse create(CreateSaleMenuCategoryRequest req) {
        SaleMenuCategory category = SaleMenuCategory.create(
                req.name(),
                req.description(),
                req.visible(),
                req.displayOrder()
        );
        return SaleMenuCategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public SaleMenuCategoryResponse update(Long id, UpdateSaleMenuCategoryRequest req) {
        SaleMenuCategory category = getById(id);
        category.update(req.name(), req.description(), req.visible(), req.displayOrder());
        return SaleMenuCategoryResponse.from(category);
    }

    @Transactional
    public void delete(Long id) {
        SaleMenuCategory category = getById(id);
        if (saleMenuRepository.existsByCategory(category)) {
            throw new BusinessException(ErrorCode.SALE_MENU_CATEGORY_IN_USE);
        }
        categoryRepository.delete(category);
    }

    @Transactional(readOnly = true)
    public SaleMenuCategory getById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SALE_MENU_CATEGORY_NOT_FOUND));
    }
}
