package com.cj.restaurantbook.sale_menu_category.infrastructure;

import com.cj.restaurantbook.sale_menu_category.domain.SaleMenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SaleMenuCategoryRepository extends JpaRepository<SaleMenuCategory, Long> {

    @Query("SELECT c FROM SaleMenuCategory c ORDER BY c.displayOrder ASC, c.id ASC")
    List<SaleMenuCategory> findAllOrderByDisplayOrder();

    Optional<SaleMenuCategory> findByName(String name);
}
