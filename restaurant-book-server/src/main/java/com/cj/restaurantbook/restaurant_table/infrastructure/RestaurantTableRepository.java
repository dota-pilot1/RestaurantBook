package com.cj.restaurantbook.restaurant_table.infrastructure;

import com.cj.restaurantbook.restaurant_table.domain.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {

    @Query("SELECT t FROM RestaurantTable t ORDER BY t.displayOrder ASC, t.name ASC")
    List<RestaurantTable> findAllOrdered();

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);
}
