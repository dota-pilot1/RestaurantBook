package com.cj.restaurantbook.sale_menu.infrastructure;

import com.cj.restaurantbook.sale_menu.domain.SaleMenu;
import com.cj.restaurantbook.sale_menu.domain.SaleMenuStatus;
import com.cj.restaurantbook.sale_menu_category.domain.SaleMenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Collection;

public interface SaleMenuRepository extends JpaRepository<SaleMenu, Long> {

    boolean existsByCategory(SaleMenuCategory category);

    Optional<SaleMenu> findByName(String name);

    @Query("""
            SELECT m
            FROM SaleMenu m
            LEFT JOIN FETCH m.category c
            WHERE (:categoryId IS NULL OR c.id = :categoryId)
              AND (:status IS NULL OR m.status = :status)
              AND (:visible IS NULL OR m.visible = :visible)
              AND LOWER(m.name) LIKE :keywordPattern
            ORDER BY COALESCE(c.displayOrder, 999999) ASC, m.displayOrder ASC, m.id ASC
            """)
    List<SaleMenu> findAllByFiltersAndKeyword(
            @Param("categoryId") Long categoryId,
            @Param("status") SaleMenuStatus status,
            @Param("visible") Boolean visible,
            @Param("keywordPattern") String keywordPattern
    );

    @Query("""
            SELECT m
            FROM SaleMenu m
            LEFT JOIN FETCH m.category c
            WHERE (:categoryId IS NULL OR c.id = :categoryId)
              AND (:status IS NULL OR m.status = :status)
              AND (:visible IS NULL OR m.visible = :visible)
            ORDER BY COALESCE(c.displayOrder, 999999) ASC, m.displayOrder ASC, m.id ASC
            """)
    List<SaleMenu> findAllByFilters(
            @Param("categoryId") Long categoryId,
            @Param("status") SaleMenuStatus status,
            @Param("visible") Boolean visible
    );

    @Query("""
            SELECT m
            FROM SaleMenu m
            LEFT JOIN FETCH m.category c
            WHERE m.visible = true
              AND m.status IN :statuses
              AND (:categoryId IS NULL OR c.id = :categoryId)
              AND ((:dineIn = true AND m.availableDineIn = true)
                OR (:takeout = true AND m.availableTakeout = true))
            ORDER BY COALESCE(c.displayOrder, 999999) ASC, m.displayOrder ASC, m.id ASC
            """)
    List<SaleMenu> findCustomerSaleMenus(
            @Param("statuses") Collection<SaleMenuStatus> statuses,
            @Param("dineIn") boolean dineIn,
            @Param("takeout") boolean takeout,
            @Param("categoryId") Long categoryId
    );
}
