package com.cj.restaurantbook.sale_menu_set.infrastructure;

import com.cj.restaurantbook.sale_menu.domain.SaleMenuStatus;
import com.cj.restaurantbook.sale_menu_set.domain.SaleMenuSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SaleMenuSetRepository extends JpaRepository<SaleMenuSet, Long> {

    Optional<SaleMenuSet> findByName(String name);

    @Query("""
            SELECT DISTINCT s
            FROM SaleMenuSet s
            LEFT JOIN FETCH s.items i
            LEFT JOIN FETCH i.saleMenu m
            WHERE s.id = :id
            """)
    Optional<SaleMenuSet> findByIdWithItems(@Param("id") Long id);

    @Query("""
            SELECT DISTINCT s
            FROM SaleMenuSet s
            LEFT JOIN FETCH s.items i
            LEFT JOIN FETCH i.saleMenu m
            WHERE (:status IS NULL OR s.status = :status)
              AND (:visible IS NULL OR s.visible = :visible)
              AND LOWER(s.name) LIKE :keywordPattern
            ORDER BY s.displayOrder ASC, s.id ASC
            """)
    List<SaleMenuSet> findAllByFiltersAndKeyword(
            @Param("status") SaleMenuStatus status,
            @Param("visible") Boolean visible,
            @Param("keywordPattern") String keywordPattern
    );

    @Query("""
            SELECT DISTINCT s
            FROM SaleMenuSet s
            LEFT JOIN FETCH s.items i
            LEFT JOIN FETCH i.saleMenu m
            WHERE (:status IS NULL OR s.status = :status)
              AND (:visible IS NULL OR s.visible = :visible)
            ORDER BY s.displayOrder ASC, s.id ASC
            """)
    List<SaleMenuSet> findAllByFilters(
            @Param("status") SaleMenuStatus status,
            @Param("visible") Boolean visible
    );

    @Query("""
            SELECT DISTINCT s
            FROM SaleMenuSet s
            LEFT JOIN FETCH s.items i
            LEFT JOIN FETCH i.saleMenu m
            WHERE s.visible = true
              AND s.status IN :statuses
              AND ((:dineIn = true AND s.availableDineIn = true)
                OR (:takeout = true AND s.availableTakeout = true))
            ORDER BY s.displayOrder ASC, s.id ASC
            """)
    List<SaleMenuSet> findCustomerSaleMenuSets(
            @Param("statuses") Collection<SaleMenuStatus> statuses,
            @Param("dineIn") boolean dineIn,
            @Param("takeout") boolean takeout
    );
}
