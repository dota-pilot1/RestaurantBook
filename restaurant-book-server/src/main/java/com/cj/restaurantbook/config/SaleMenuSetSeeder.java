package com.cj.restaurantbook.config;

import com.cj.restaurantbook.sale_menu.domain.SaleMenu;
import com.cj.restaurantbook.sale_menu.domain.SaleMenuStatus;
import com.cj.restaurantbook.sale_menu.infrastructure.SaleMenuRepository;
import com.cj.restaurantbook.sale_menu_set.domain.SaleMenuSet;
import com.cj.restaurantbook.sale_menu_set.domain.SaleMenuSetItem;
import com.cj.restaurantbook.sale_menu_set.infrastructure.SaleMenuSetRepository;
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
@Order(7)
@RequiredArgsConstructor
public class SaleMenuSetSeeder implements ApplicationRunner {

    private final SaleMenuRepository saleMenuRepository;
    private final SaleMenuSetRepository saleMenuSetRepository;

    @Value("${app.seed.sale-menu-set.enabled:true}")
    private boolean enabled;

    private record SetItemDef(String saleMenuName, int quantity, int displayOrder) {}

    private record SetDef(
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
            int displayOrder,
            List<SetItemDef> items
    ) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled) {
            log.info("Sale menu set seeding is disabled.");
            return;
        }

        List<SetDef> sets = List.of(
                new SetDef(
                        "대표 한상 세트",
                        "육회 비빔밥에 오늘의 반찬과 전통 음료를 곁들인 대표 구성",
                        "대표 비빔밥에 반찬과 전통 음료를 더한 균형 있는 한상 구성입니다.",
                        "육회 비빔밥, 오늘의 반찬, 식혜",
                        "소고기, 계란, 대두, 밀, 참깨",
                        1110,
                        168,
                        42,
                        29,
                        2025,
                        15900,
                        0,
                        List.of(
                                new SetItemDef("육회 비빔밥", 1, 0),
                                new SetItemDef("오늘의 반찬", 1, 1),
                                new SetItemDef("식혜", 1, 2)
                        )
                ),
                new SetDef(
                        "든든 점심 세트",
                        "제육 덮밥과 된장 찌개를 함께 담은 점심 기본 구성",
                        "매콤한 제육 덮밥과 구수한 된장 찌개를 함께 즐기는 점심 한상입니다.",
                        "제육 덮밥, 된장 찌개, 오늘의 반찬",
                        "돼지고기, 대두, 밀, 멸치, 참깨",
                        1400,
                        166,
                        59,
                        52,
                        3960,
                        14900,
                        1,
                        List.of(
                                new SetItemDef("제육 덮밥", 1, 0),
                                new SetItemDef("된장 찌개", 1, 1),
                                new SetItemDef("오늘의 반찬", 1, 2)
                        )
                ),
                new SetDef(
                        "찌개 한상 세트",
                        "김치 찌개와 밥 반찬, 전통 음료로 구성한 따뜻한 한상",
                        "뜨끈한 김치 찌개에 반찬과 수정과를 곁들인 따뜻한 세트입니다.",
                        "김치 찌개, 오늘의 반찬, 수정과",
                        "돼지고기, 대두, 밀, 새우젓, 참깨",
                        870,
                        105,
                        34,
                        35,
                        2690,
                        13900,
                        2,
                        List.of(
                                new SetItemDef("김치 찌개", 1, 0),
                                new SetItemDef("오늘의 반찬", 1, 1),
                                new SetItemDef("수정과", 1, 2)
                        )
                ),
                new SetDef(
                        "파전 주안상 세트",
                        "해물 파전과 고기 만두, 음료를 함께 즐기는 나눔 구성",
                        "해물 파전과 고기 만두, 탄산음료를 함께 나누기 좋은 사이드 세트입니다.",
                        "해물 파전, 고기 만두, 콜라",
                        "밀, 계란, 오징어, 새우, 돼지고기, 대두, 참깨",
                        1390,
                        190,
                        46,
                        48,
                        2270,
                        19900,
                        3,
                        List.of(
                                new SetItemDef("해물 파전", 1, 0),
                                new SetItemDef("고기 만두", 1, 1),
                                new SetItemDef("콜라", 2, 2)
                        )
                )
        );

        for (SetDef setDef : sets) {
            SaleMenuSet saleMenuSet = saleMenuSetRepository.findByName(setDef.name())
                    .orElseGet(() -> {
                        SaleMenuSet created = SaleMenuSet.create(
                                setDef.name(),
                                setDef.description(),
                                setDef.detailDescription(),
                                setDef.ingredients(),
                                setDef.allergens(),
                                setDef.caloriesKcal(),
                                setDef.carbohydrateG(),
                                setDef.proteinG(),
                                setDef.fatG(),
                                setDef.sodiumMg(),
                                setDef.price(),
                                null,
                                SaleMenuStatus.ACTIVE,
                                true,
                                true,
                                true,
                                setDef.displayOrder()
                        );
                        log.info("Seeded sale menu set: {}", setDef.name());
                        return saleMenuSetRepository.save(created);
                    });

            saleMenuSet.update(
                    setDef.name(),
                    setDef.description(),
                    coalesce(saleMenuSet.getDetailDescription(), setDef.detailDescription()),
                    coalesce(saleMenuSet.getIngredients(), setDef.ingredients()),
                    coalesce(saleMenuSet.getAllergens(), setDef.allergens()),
                    coalesce(saleMenuSet.getCaloriesKcal(), setDef.caloriesKcal()),
                    coalesce(saleMenuSet.getCarbohydrateG(), setDef.carbohydrateG()),
                    coalesce(saleMenuSet.getProteinG(), setDef.proteinG()),
                    coalesce(saleMenuSet.getFatG(), setDef.fatG()),
                    coalesce(saleMenuSet.getSodiumMg(), setDef.sodiumMg()),
                    setDef.price(),
                    saleMenuSet.getImageUrl(),
                    SaleMenuStatus.ACTIVE,
                    true,
                    true,
                    true,
                    setDef.displayOrder()
            );
            saleMenuSet.replaceItems(resolveItems(setDef.items()));
        }
    }

    private List<SaleMenuSetItem> resolveItems(List<SetItemDef> items) {
        return items.stream()
                .map(item -> {
                    SaleMenu saleMenu = saleMenuRepository.findByName(item.saleMenuName())
                            .orElseThrow(() -> new IllegalStateException("Sale menu not found: " + item.saleMenuName()));
                    return SaleMenuSetItem.create(saleMenu, item.quantity(), item.displayOrder());
                })
                .toList();
    }

    private static String coalesce(String current, String fallback) {
        return current == null || current.isBlank() ? fallback : current;
    }

    private static Integer coalesce(Integer current, Integer fallback) {
        return current == null ? fallback : current;
    }
}
