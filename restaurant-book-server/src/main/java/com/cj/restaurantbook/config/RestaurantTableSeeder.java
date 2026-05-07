package com.cj.restaurantbook.config;

import com.cj.restaurantbook.restaurant_table.domain.RestaurantTable;
import com.cj.restaurantbook.restaurant_table.infrastructure.RestaurantTableRepository;
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
public class RestaurantTableSeeder implements ApplicationRunner {

    private final RestaurantTableRepository tableRepository;

    @Value("${app.seed.table.enabled:true}")
    private boolean enabled;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled || tableRepository.count() > 0) return;

        List<String> tableNames = List.of(
                "1번 테이블", "2번 테이블", "3번 테이블", "4번 테이블",
                "5번 테이블", "6번 테이블", "7번 테이블", "8번 테이블"
        );

        for (int i = 0; i < tableNames.size(); i++) {
            tableRepository.save(RestaurantTable.create(tableNames.get(i), true, i + 1));
        }

        log.info("Seeded {} restaurant tables", tableNames.size());
    }
}
