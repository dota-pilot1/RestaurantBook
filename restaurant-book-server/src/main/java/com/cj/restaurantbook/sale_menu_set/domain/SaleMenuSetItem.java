package com.cj.restaurantbook.sale_menu_set.domain;

import com.cj.restaurantbook.sale_menu.domain.SaleMenu;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "sale_menu_set_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SaleMenuSetItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sale_menu_set_id", nullable = false)
    private SaleMenuSet saleMenuSet;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sale_menu_id", nullable = false)
    private SaleMenu saleMenu;

    @Column(nullable = false)
    private int quantity = 1;

    @Column(nullable = false)
    private int displayOrder = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static SaleMenuSetItem create(SaleMenu saleMenu, int quantity, int displayOrder) {
        SaleMenuSetItem item = new SaleMenuSetItem();
        item.saleMenu = saleMenu;
        item.quantity = quantity;
        item.displayOrder = displayOrder;
        return item;
    }

    void assignTo(SaleMenuSet saleMenuSet) {
        this.saleMenuSet = saleMenuSet;
    }
}
