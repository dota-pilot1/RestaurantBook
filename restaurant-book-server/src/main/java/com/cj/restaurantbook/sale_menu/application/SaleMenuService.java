package com.cj.restaurantbook.sale_menu.application;

import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import com.cj.restaurantbook.sale_menu.domain.SaleMenu;
import com.cj.restaurantbook.sale_menu.domain.SaleMenuStatus;
import com.cj.restaurantbook.sale_menu.infrastructure.SaleMenuRepository;
import com.cj.restaurantbook.sale_menu.presentation.dto.CreateSaleMenuRequest;
import com.cj.restaurantbook.sale_menu.presentation.dto.SaleMenuResponse;
import com.cj.restaurantbook.sale_menu.presentation.dto.UpdateSaleMenuRequest;
import com.cj.restaurantbook.sale_menu_category.domain.SaleMenuCategory;
import com.cj.restaurantbook.sale_menu_category.infrastructure.SaleMenuCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class SaleMenuService {

    private final SaleMenuRepository saleMenuRepository;
    private final SaleMenuCategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<SaleMenuResponse> findAll(Long categoryId, SaleMenuStatus status, Boolean visible, String keyword) {
        List<SaleMenu> menus = StringUtils.hasText(keyword)
                ? saleMenuRepository.findAllByFiltersAndKeyword(
                        categoryId,
                        status,
                        visible,
                        "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%"
                )
                : saleMenuRepository.findAllByFilters(categoryId, status, visible);

        return menus
                .stream()
                .map(SaleMenuResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public SaleMenuResponse get(Long id) {
        return SaleMenuResponse.from(getById(id));
    }

    @Transactional
    public SaleMenuResponse create(CreateSaleMenuRequest req) {
        SaleMenuCategory category = resolveCategory(req.categoryId());
        SaleMenu menu = SaleMenu.create(
                category,
                req.name(),
                req.description(),
                req.detailDescription(),
                req.ingredients(),
                req.allergens(),
                req.caloriesKcal(),
                req.carbohydrateG(),
                req.proteinG(),
                req.fatG(),
                req.sodiumMg(),
                req.price(),
                req.imageUrl(),
                req.status(),
                req.visible(),
                req.availableDineIn(),
                req.availableTakeout(),
                resolveRequiresCooking(req.requiresCooking()),
                req.displayOrder()
        );
        return SaleMenuResponse.from(saleMenuRepository.save(menu));
    }

    @Transactional
    public SaleMenuResponse update(Long id, UpdateSaleMenuRequest req) {
        SaleMenu menu = getById(id);
        SaleMenuCategory category = resolveCategory(req.categoryId());
        menu.update(
                category,
                req.name(),
                req.description(),
                req.detailDescription(),
                req.ingredients(),
                req.allergens(),
                req.caloriesKcal(),
                req.carbohydrateG(),
                req.proteinG(),
                req.fatG(),
                req.sodiumMg(),
                req.price(),
                req.imageUrl(),
                req.status(),
                req.visible(),
                req.availableDineIn(),
                req.availableTakeout(),
                resolveRequiresCooking(req.requiresCooking()),
                req.displayOrder()
        );
        return SaleMenuResponse.from(menu);
    }

    @Transactional
    public void delete(Long id) {
        saleMenuRepository.delete(getById(id));
    }

    private SaleMenu getById(Long id) {
        return saleMenuRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SALE_MENU_NOT_FOUND));
    }

    private SaleMenuCategory resolveCategory(Long categoryId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SALE_MENU_CATEGORY_NOT_FOUND));
    }

    private boolean resolveRequiresCooking(Boolean requiresCooking) {
        return requiresCooking == null || requiresCooking;
    }
}
