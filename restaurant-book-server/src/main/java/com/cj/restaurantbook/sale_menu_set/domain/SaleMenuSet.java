package com.cj.restaurantbook.sale_menu_set.domain;

import com.cj.restaurantbook.sale_menu.domain.SaleMenuStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Entity
@Table(name = "sale_menu_sets")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SaleMenuSet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    @Column(nullable = false)
    private int displayOrder = 0;

    @OneToMany(mappedBy = "saleMenuSet", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<SaleMenuSetItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static SaleMenuSet create(
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
            int displayOrder
    ) {
        SaleMenuSet set = new SaleMenuSet();
        set.name = name;
        set.description = description;
        set.detailDescription = detailDescription;
        set.ingredients = ingredients;
        set.allergens = allergens;
        set.caloriesKcal = caloriesKcal;
        set.carbohydrateG = carbohydrateG;
        set.proteinG = proteinG;
        set.fatG = fatG;
        set.sodiumMg = sodiumMg;
        set.price = price;
        set.imageUrl = imageUrl;
        set.status = status;
        set.visible = visible;
        set.availableDineIn = availableDineIn;
        set.availableTakeout = availableTakeout;
        set.displayOrder = displayOrder;
        return set;
    }

    public void update(
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
            int displayOrder
    ) {
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
        this.displayOrder = displayOrder;
    }

    public void replaceItems(List<SaleMenuSetItem> newItems) {
        this.items.clear();
        newItems.forEach(item -> item.assignTo(this));
        this.items.addAll(newItems);
        this.items.sort(Comparator.comparingInt(SaleMenuSetItem::getDisplayOrder).thenComparing(SaleMenuSetItem::getId, Comparator.nullsLast(Long::compareTo)));
    }

    public boolean requiresCooking() {
        return items.isEmpty() || items.stream()
                .anyMatch(item -> item.getSaleMenu().isRequiresCooking());
    }
}
