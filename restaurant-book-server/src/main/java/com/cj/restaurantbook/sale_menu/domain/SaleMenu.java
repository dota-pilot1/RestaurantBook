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
            int price,
            String imageUrl,
            SaleMenuStatus status,
            boolean visible,
            boolean availableDineIn,
            boolean availableTakeout,
            int displayOrder
    ) {
        SaleMenu menu = new SaleMenu();
        menu.category = category;
        menu.name = name;
        menu.description = description;
        menu.price = price;
        menu.imageUrl = imageUrl;
        menu.status = status;
        menu.visible = visible;
        menu.availableDineIn = availableDineIn;
        menu.availableTakeout = availableTakeout;
        menu.displayOrder = displayOrder;
        return menu;
    }

    public void update(
            SaleMenuCategory category,
            String name,
            String description,
            int price,
            String imageUrl,
            SaleMenuStatus status,
            boolean visible,
            boolean availableDineIn,
            boolean availableTakeout,
            int displayOrder
    ) {
        this.category = category;
        this.name = name;
        this.description = description;
        this.price = price;
        this.imageUrl = imageUrl;
        this.status = status;
        this.visible = visible;
        this.availableDineIn = availableDineIn;
        this.availableTakeout = availableTakeout;
        this.displayOrder = displayOrder;
    }
}
