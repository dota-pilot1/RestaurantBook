package com.cj.restaurantbook.sale_menu_set.infrastructure;

import com.cj.restaurantbook.sale_menu_set.domain.SaleMenuSetItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SaleMenuSetItemRepository extends JpaRepository<SaleMenuSetItem, Long> {
}
