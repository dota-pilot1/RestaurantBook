package com.cj.restaurantbook.sale_menu_set.application;

import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import com.cj.restaurantbook.sale_menu.domain.SaleMenu;
import com.cj.restaurantbook.sale_menu.domain.SaleMenuStatus;
import com.cj.restaurantbook.sale_menu.infrastructure.SaleMenuRepository;
import com.cj.restaurantbook.sale_menu_set.domain.SaleMenuSet;
import com.cj.restaurantbook.sale_menu_set.domain.SaleMenuSetItem;
import com.cj.restaurantbook.sale_menu_set.infrastructure.SaleMenuSetRepository;
import com.cj.restaurantbook.sale_menu_set.presentation.dto.CreateSaleMenuSetRequest;
import com.cj.restaurantbook.sale_menu_set.presentation.dto.SaleMenuSetItemRequest;
import com.cj.restaurantbook.sale_menu_set.presentation.dto.SaleMenuSetResponse;
import com.cj.restaurantbook.sale_menu_set.presentation.dto.UpdateSaleMenuSetRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SaleMenuSetService {

    private final SaleMenuSetRepository saleMenuSetRepository;
    private final SaleMenuRepository saleMenuRepository;

    @Transactional(readOnly = true)
    public List<SaleMenuSetResponse> findAll(SaleMenuStatus status, Boolean visible, String keyword) {
        List<SaleMenuSet> sets = StringUtils.hasText(keyword)
                ? saleMenuSetRepository.findAllByFiltersAndKeyword(
                        status,
                        visible,
                        "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%"
                )
                : saleMenuSetRepository.findAllByFilters(status, visible);

        return sets.stream()
                .map(SaleMenuSetResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public SaleMenuSetResponse get(Long id) {
        return SaleMenuSetResponse.from(getById(id));
    }

    @Transactional
    public SaleMenuSetResponse create(CreateSaleMenuSetRequest req) {
        SaleMenuSet set = SaleMenuSet.create(
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
                req.displayOrder()
        );
        set.replaceItems(resolveItems(req.items()));
        return SaleMenuSetResponse.from(saleMenuSetRepository.save(set));
    }

    @Transactional
    public SaleMenuSetResponse update(Long id, UpdateSaleMenuSetRequest req) {
        SaleMenuSet set = getById(id);
        set.update(
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
                req.displayOrder()
        );
        set.replaceItems(resolveItems(req.items()));
        return SaleMenuSetResponse.from(set);
    }

    @Transactional
    public void delete(Long id) {
        saleMenuSetRepository.delete(getById(id));
    }

    private SaleMenuSet getById(Long id) {
        return saleMenuSetRepository.findByIdWithItems(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SALE_MENU_SET_NOT_FOUND));
    }

    private List<SaleMenuSetItem> resolveItems(List<SaleMenuSetItemRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new BusinessException(ErrorCode.SALE_MENU_SET_EMPTY_ITEMS);
        }

        HashSet<Long> uniqueMenuIds = new HashSet<>();
        for (SaleMenuSetItemRequest request : requests) {
            if (!uniqueMenuIds.add(request.saleMenuId())) {
                throw new BusinessException(ErrorCode.SALE_MENU_SET_ITEM_INVALID);
            }
        }

        Map<Long, SaleMenu> menusById = saleMenuRepository.findAllById(uniqueMenuIds).stream()
                .collect(Collectors.toMap(SaleMenu::getId, Function.identity()));

        if (menusById.size() != uniqueMenuIds.size()) {
            throw new BusinessException(ErrorCode.SALE_MENU_NOT_FOUND);
        }

        return requests.stream()
                .map(request -> SaleMenuSetItem.create(
                        menusById.get(request.saleMenuId()),
                        request.quantity(),
                        request.displayOrder()
                ))
                .toList();
    }
}
