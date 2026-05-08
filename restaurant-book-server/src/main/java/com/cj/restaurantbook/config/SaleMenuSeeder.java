package com.cj.restaurantbook.config;

import com.cj.restaurantbook.sale_menu.domain.SaleMenu;
import com.cj.restaurantbook.sale_menu.domain.SaleMenuStatus;
import com.cj.restaurantbook.sale_menu.infrastructure.SaleMenuRepository;
import com.cj.restaurantbook.sale_menu_category.domain.SaleMenuCategory;
import com.cj.restaurantbook.sale_menu_category.infrastructure.SaleMenuCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@Order(6)
@RequiredArgsConstructor
public class SaleMenuSeeder implements ApplicationRunner {

    private final SaleMenuCategoryRepository categoryRepository;
    private final SaleMenuRepository saleMenuRepository;

    @Value("${app.seed.sale-menu.enabled:true}")
    private boolean enabled;

    private record CategoryDef(String name, String description, int displayOrder) {}

    private record MenuDef(
            String categoryName,
            String name,
            String description,
            int price,
            boolean requiresCooking,
            int displayOrder
    ) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled) {
            log.info("Sale menu seeding is disabled.");
            return;
        }

        List<CategoryDef> categories = List.of(
                new CategoryDef("식사", "비빔밥, 덮밥 등 한 그릇 식사 메뉴", 0),
                new CategoryDef("국/찌개", "따뜻하게 제공되는 국과 찌개 메뉴", 1),
                new CategoryDef("면/분식", "국수, 떡볶이 등 가볍게 주문하기 좋은 메뉴", 2),
                new CategoryDef("사이드", "전, 만두, 반찬 등 곁들임 메뉴", 3),
                new CategoryDef("음료", "식사와 함께 제공되는 음료 메뉴", 4)
        );

        for (CategoryDef category : categories) {
            categoryRepository.findByName(category.name()).ifPresentOrElse(
                    existing -> existing.update(category.name(), category.description(), true, category.displayOrder()),
                    () -> {
                SaleMenuCategory saved = categoryRepository.save(SaleMenuCategory.create(
                        category.name(),
                        category.description(),
                        true,
                        category.displayOrder()
                ));
                log.info("Seeded sale menu category: {}", category.name());
                    }
            );
        }

        List<MenuDef> menus = List.of(
                new MenuDef("식사", "육회 비빔밥", "신선한 육회와 나물을 올린 대표 비빔밥", 12000, true, 0),
                new MenuDef("식사", "제육 덮밥", "매콤한 제육볶음을 올린 든든한 덮밥", 10000, true, 1),
                new MenuDef("식사", "불고기 덮밥", "달큰한 간장 불고기와 밥을 함께 담은 메뉴", 11000, true, 2),
                new MenuDef("국/찌개", "김치 찌개", "묵은지와 돼지고기를 넣고 끓인 김치 찌개", 10000, true, 0),
                new MenuDef("국/찌개", "된장 찌개", "구수한 된장과 두부, 채소를 넣은 기본 찌개", 9000, true, 1),
                new MenuDef("국/찌개", "소고기 미역국", "소고기와 미역을 푹 끓인 담백한 국", 9000, true, 2),
                new MenuDef("면/분식", "잔치 국수", "멸치 육수와 고명을 올린 따뜻한 국수", 8000, true, 0),
                new MenuDef("면/분식", "떡볶이", "매콤달콤한 양념의 기본 떡볶이", 7000, true, 1),
                new MenuDef("사이드", "해물 파전", "해물과 쪽파를 넉넉히 넣은 바삭한 파전", 15000, true, 0),
                new MenuDef("사이드", "김치전", "잘 익은 김치를 넣어 바삭하게 부친 전", 10000, true, 1),
                new MenuDef("사이드", "고기 만두", "육즙이 살아있는 찐만두", 6000, true, 2),
                new MenuDef("사이드", "오늘의 반찬", "매장에서 준비한 기본 반찬 구성", 4000, true, 3),
                new MenuDef("음료", "식혜", "달콤하고 시원한 전통 음료", 4000, false, 0),
                new MenuDef("음료", "수정과", "계피 향이 은은한 전통 음료", 4000, false, 1),
                new MenuDef("음료", "콜라", "시원한 탄산음료", 2500, false, 2)
        );

        for (MenuDef menu : menus) {
            SaleMenuCategory category = categoryRepository.findByName(menu.categoryName())
                    .orElseThrow(() -> new IllegalStateException("Sale menu category not found: " + menu.categoryName()));
            saleMenuRepository.findByName(menu.name()).ifPresentOrElse(
                    existing -> existing.update(
                            category,
                            menu.name(),
                            menu.description(),
                            menu.price(),
                            existing.getImageUrl(),
                            SaleMenuStatus.ACTIVE,
                            true,
                            true,
                            true,
                            menu.requiresCooking(),
                            menu.displayOrder()
                    ),
                    () -> {
                        saleMenuRepository.save(SaleMenu.create(
                                category,
                                menu.name(),
                                menu.description(),
                                menu.price(),
                                null,
                                SaleMenuStatus.ACTIVE,
                                true,
                                true,
                                true,
                                menu.requiresCooking(),
                                menu.displayOrder()
                        ));
                        log.info("Seeded sale menu: {}", menu.name());
                    }
            );
        }
    }
}
