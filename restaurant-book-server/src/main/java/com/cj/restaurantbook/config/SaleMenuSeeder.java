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
            String detailDescription,
            String ingredients,
            String allergens,
            Integer caloriesKcal,
            Integer carbohydrateG,
            Integer proteinG,
            Integer fatG,
            Integer sodiumMg,
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
                new MenuDef("식사", "육회 비빔밥", "신선한 육회와 나물을 올린 대표 비빔밥", "고소한 참기름 향과 신선한 육회, 제철 나물을 한 그릇에 담은 대표 식사 메뉴입니다.", "쌀, 소고기 육회, 계란, 고사리, 시금치, 콩나물, 무생채, 고추장, 참기름", "소고기, 계란, 대두, 밀, 참깨", 720, 92, 34, 22, 1180, 12000, true, 0),
                new MenuDef("식사", "제육 덮밥", "매콤한 제육볶음을 올린 든든한 덮밥", "매콤달콤하게 볶은 돼지고기를 따뜻한 밥 위에 올린 든든한 한 끼입니다.", "쌀, 돼지고기, 양파, 대파, 고추장, 고춧가루, 간장, 마늘", "돼지고기, 대두, 밀, 참깨", 790, 98, 31, 27, 1420, 10000, true, 1),
                new MenuDef("식사", "불고기 덮밥", "달큰한 간장 불고기와 밥을 함께 담은 메뉴", "부드러운 소고기 불고기와 양파를 달큰한 간장 양념으로 볶아 밥과 함께 제공합니다.", "쌀, 소고기, 양파, 대파, 간장, 설탕, 배, 마늘, 참기름", "소고기, 대두, 밀, 참깨", 760, 96, 32, 24, 1260, 11000, true, 2),
                new MenuDef("국/찌개", "김치 찌개", "묵은지와 돼지고기를 넣고 끓인 김치 찌개", "깊게 익은 김치와 돼지고기를 넣고 진하게 끓인 매콤한 찌개입니다.", "김치, 돼지고기, 두부, 대파, 양파, 고춧가루, 마늘", "돼지고기, 대두, 새우젓", 520, 38, 27, 28, 1850, 10000, true, 0),
                new MenuDef("국/찌개", "된장 찌개", "구수한 된장과 두부, 채소를 넣은 기본 찌개", "구수한 된장 국물에 두부와 채소를 넣어 끓인 기본 찌개입니다.", "된장, 두부, 애호박, 양파, 감자, 대파, 멸치 육수", "대두, 밀, 멸치", 430, 44, 22, 18, 1720, 9000, true, 1),
                new MenuDef("국/찌개", "소고기 미역국", "소고기와 미역을 푹 끓인 담백한 국", "소고기와 미역을 오래 끓여 담백하고 부드럽게 즐기는 국 메뉴입니다.", "소고기, 미역, 국간장, 참기름, 마늘", "소고기, 대두, 밀, 참깨", 360, 18, 26, 20, 1120, 9000, true, 2),
                new MenuDef("면/분식", "잔치 국수", "멸치 육수와 고명을 올린 따뜻한 국수", "따뜻한 멸치 육수에 소면과 고명을 올린 가벼운 국수 메뉴입니다.", "소면, 멸치 육수, 계란, 애호박, 김가루, 양념장", "밀, 계란, 대두, 멸치", 560, 96, 18, 10, 1540, 8000, true, 0),
                new MenuDef("면/분식", "떡볶이", "매콤달콤한 양념의 기본 떡볶이", "쫄깃한 떡과 어묵을 매콤달콤한 고추장 양념에 졸인 분식 메뉴입니다.", "쌀떡, 어묵, 고추장, 설탕, 대파, 고춧가루", "밀, 대두, 어묵", 610, 112, 13, 9, 1380, 7000, true, 1),
                new MenuDef("사이드", "해물 파전", "해물과 쪽파를 넉넉히 넣은 바삭한 파전", "쪽파와 해물을 듬뿍 넣어 겉은 바삭하고 속은 촉촉하게 부친 전입니다.", "쪽파, 오징어, 새우, 부침가루, 계란, 식용유", "밀, 계란, 오징어, 새우", 690, 72, 28, 32, 1260, 15000, true, 0),
                new MenuDef("사이드", "김치전", "잘 익은 김치를 넣어 바삭하게 부친 전", "잘 익은 김치를 넣어 매콤하고 바삭하게 부친 전 메뉴입니다.", "김치, 부침가루, 대파, 고춧가루, 식용유", "밀, 대두, 새우젓", 540, 68, 12, 24, 1180, 10000, true, 1),
                new MenuDef("사이드", "고기 만두", "육즙이 살아있는 찐만두", "돼지고기와 채소를 넣은 속을 촉촉하게 쪄낸 만두입니다.", "돼지고기, 밀가루 만두피, 부추, 양배추, 두부, 대파", "돼지고기, 밀, 대두, 참깨", 420, 48, 18, 16, 980, 6000, true, 2),
                new MenuDef("사이드", "오늘의 반찬", "매장에서 준비한 기본 반찬 구성", "매장에서 당일 준비한 기본 반찬을 소량 구성한 사이드 메뉴입니다.", "김치, 나물, 장아찌 등 당일 반찬 구성", "대두, 밀, 참깨, 새우젓", 180, 24, 6, 7, 820, 4000, true, 3),
                new MenuDef("음료", "식혜", "달콤하고 시원한 전통 음료", "엿기름과 밥알의 은은한 단맛을 살린 차가운 전통 음료입니다.", "정제수, 엿기름, 쌀, 설탕", "", 210, 52, 2, 0, 25, 4000, false, 0),
                new MenuDef("음료", "수정과", "계피 향이 은은한 전통 음료", "계피와 생강 향이 은은하게 퍼지는 달콤한 전통 음료입니다.", "정제수, 계피, 생강, 설탕, 곶감", "", 170, 43, 1, 0, 20, 4000, false, 1),
                new MenuDef("음료", "콜라", "시원한 탄산음료", "식사와 함께 즐기기 좋은 차가운 탄산음료입니다.", "탄산수, 액상과당, 캐러멜 색소, 향료", "", 140, 35, 0, 0, 15, 2500, false, 2)
        );

        for (MenuDef menu : menus) {
            SaleMenuCategory category = categoryRepository.findByName(menu.categoryName())
                    .orElseThrow(() -> new IllegalStateException("Sale menu category not found: " + menu.categoryName()));
            saleMenuRepository.findByName(menu.name()).ifPresentOrElse(
                    existing -> existing.update(
                            category,
                            menu.name(),
                            menu.description(),
                            coalesce(existing.getDetailDescription(), menu.detailDescription()),
                            coalesce(existing.getIngredients(), menu.ingredients()),
                            coalesce(existing.getAllergens(), menu.allergens()),
                            coalesce(existing.getCaloriesKcal(), menu.caloriesKcal()),
                            coalesce(existing.getCarbohydrateG(), menu.carbohydrateG()),
                            coalesce(existing.getProteinG(), menu.proteinG()),
                            coalesce(existing.getFatG(), menu.fatG()),
                            coalesce(existing.getSodiumMg(), menu.sodiumMg()),
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
                                menu.detailDescription(),
                                menu.ingredients(),
                                menu.allergens(),
                                menu.caloriesKcal(),
                                menu.carbohydrateG(),
                                menu.proteinG(),
                                menu.fatG(),
                                menu.sodiumMg(),
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

    private static String coalesce(String current, String fallback) {
        return current == null || current.isBlank() ? fallback : current;
    }

    private static Integer coalesce(Integer current, Integer fallback) {
        return current == null ? fallback : current;
    }
}
