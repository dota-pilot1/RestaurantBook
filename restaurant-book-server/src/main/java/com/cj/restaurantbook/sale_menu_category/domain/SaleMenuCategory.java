package com.cj.restaurantbook.sale_menu_category.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "sale_menu_categories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SaleMenuCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(nullable = false)
    private boolean visible = true;

    @Column(nullable = false)
    private int displayOrder = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static SaleMenuCategory create(String name, String description, boolean visible, int displayOrder) {
        SaleMenuCategory category = new SaleMenuCategory();
        category.name = name;
        category.description = description;
        category.visible = visible;
        category.displayOrder = displayOrder;
        return category;
    }

    public void update(String name, String description, boolean visible, int displayOrder) {
        this.name = name;
        this.description = description;
        this.visible = visible;
        this.displayOrder = displayOrder;
    }
}
