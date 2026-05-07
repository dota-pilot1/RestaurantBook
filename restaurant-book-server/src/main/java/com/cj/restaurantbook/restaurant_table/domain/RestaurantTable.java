package com.cj.restaurantbook.restaurant_table.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "restaurant_tables")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RestaurantTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100, unique = true)
    private String name;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private int displayOrder = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static RestaurantTable create(String name, boolean active, int displayOrder) {
        RestaurantTable table = new RestaurantTable();
        table.name = name;
        table.active = active;
        table.displayOrder = displayOrder;
        return table;
    }

    public void update(String name, boolean active, int displayOrder) {
        this.name = name;
        this.active = active;
        this.displayOrder = displayOrder;
    }
}
