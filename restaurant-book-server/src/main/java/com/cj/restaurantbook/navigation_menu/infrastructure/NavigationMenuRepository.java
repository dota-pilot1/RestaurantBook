package com.cj.restaurantbook.navigation_menu.infrastructure;

import com.cj.restaurantbook.navigation_menu.domain.NavigationMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface NavigationMenuRepository extends JpaRepository<NavigationMenu, Long> {

    boolean existsByCode(String code);

    Optional<NavigationMenu> findByCode(String code);

    @Query("SELECT m FROM NavigationMenu m LEFT JOIN FETCH m.parent ORDER BY m.displayOrder ASC")
    List<NavigationMenu> findAllOrderByDisplayOrder();
}
