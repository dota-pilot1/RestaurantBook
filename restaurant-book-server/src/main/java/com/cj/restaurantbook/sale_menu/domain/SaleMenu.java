package com.cj.restaurantbook.sale_menu.domain;

import com.cj.restaurantbook.sale_menu_category.domain.SaleMenuCategory;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "sale_menus")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SaleMenu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private SaleMenuCategory category;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(length = 1000)
    private String detailDescription;

    @Column(length = 1000)
    private String ingredients;

    @Column(length = 500)
    private String allergens;

    private Integer caloriesKcal;

    private Integer carbohydrateG;

    private Integer proteinG;

    private Integer fatG;

    private Integer sodiumMg;

    @Column(nullable = false)
    private int price;

    @Column(length = 1024)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SaleMenuStatus status = SaleMenuStatus.ACTIVE;

    @Column(nullable = false)
    private boolean visible = true;

    @Column(nullable = false)
    private boolean availableDineIn = true;

    @Column(nullable = false)
    private boolean availableTakeout = true;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean requiresCooking = true;

    @Column(nullable = false)
    private int displayOrder = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static SaleMenu create(
            SaleMenuCategory category,
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
            String imageUrl,
            SaleMenuStatus status,
            boolean visible,
            boolean availableDineIn,
            boolean availableTakeout,
            boolean requiresCooking,
            int displayOrder
    ) {
        SaleMenu menu = new SaleMenu();
        menu.category = category;
        menu.name = name;
        menu.description = description;
        menu.detailDescription = detailDescription;
        menu.ingredients = ingredients;
        menu.allergens = allergens;
        menu.caloriesKcal = caloriesKcal;
        menu.carbohydrateG = carbohydrateG;
        menu.proteinG = proteinG;
        menu.fatG = fatG;
        menu.sodiumMg = sodiumMg;
        menu.price = price;
        menu.imageUrl = imageUrl;
        menu.status = status;
        menu.visible = visible;
        menu.availableDineIn = availableDineIn;
        menu.availableTakeout = availableTakeout;
        menu.requiresCooking = requiresCooking;
        menu.displayOrder = displayOrder;
        return menu;
    }

    public void update(
            SaleMenuCategory category,
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
            String imageUrl,
            SaleMenuStatus status,
            boolean visible,
            boolean availableDineIn,
            boolean availableTakeout,
            boolean requiresCooking,
            int displayOrder
    ) {
        this.category = category;
        this.name = name;
        this.description = description;
        this.detailDescription = detailDescription;
        this.ingredients = ingredients;
        this.allergens = allergens;
        this.caloriesKcal = caloriesKcal;
        this.carbohydrateG = carbohydrateG;
        this.proteinG = proteinG;
        this.fatG = fatG;
        this.sodiumMg = sodiumMg;
        this.price = price;
        this.imageUrl = imageUrl;
        this.status = status;
        this.visible = visible;
        this.availableDineIn = availableDineIn;
        this.availableTakeout = availableTakeout;
        this.requiresCooking = requiresCooking;
        this.displayOrder = displayOrder;
    }
}
