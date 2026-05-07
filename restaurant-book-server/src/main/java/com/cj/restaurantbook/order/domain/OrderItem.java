package com.cj.restaurantbook.order.domain;

import com.cj.restaurantbook.sale_menu.domain.SaleMenu;
import com.cj.restaurantbook.sale_menu_set.domain.SaleMenuSet;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Entity
@Table(name = "order_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderItemType itemType;

    @Column
    private Long saleMenuId;

    @Column
    private Long saleMenuSetId;

    @Column(nullable = false, length = 100)
    private String itemName;

    @Column(nullable = false)
    private int unitPrice;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private int lineTotal;

    @Column(nullable = false)
    private int displayOrder;

    @OneToMany(mappedBy = "orderItem", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<OrderItemComponent> components = new ArrayList<>();

    public static OrderItem fromSaleMenu(SaleMenu menu, int quantity, int displayOrder) {
        OrderItem item = new OrderItem();
        item.itemType = OrderItemType.SALE_MENU;
        item.saleMenuId = menu.getId();
        item.saleMenuSetId = null;
        item.itemName = menu.getName();
        item.unitPrice = menu.getPrice();
        item.quantity = quantity;
        item.lineTotal = menu.getPrice() * quantity;
        item.displayOrder = displayOrder;
        return item;
    }

    public static OrderItem fromSaleMenuSet(SaleMenuSet set, int quantity, int displayOrder) {
        OrderItem item = new OrderItem();
        item.itemType = OrderItemType.SALE_MENU_SET;
        item.saleMenuId = null;
        item.saleMenuSetId = set.getId();
        item.itemName = set.getName();
        item.unitPrice = set.getPrice();
        item.quantity = quantity;
        item.lineTotal = set.getPrice() * quantity;
        item.displayOrder = displayOrder;

        set.getItems().stream()
                .sorted(Comparator.comparingInt(com.cj.restaurantbook.sale_menu_set.domain.SaleMenuSetItem::getDisplayOrder))
                .map(OrderItemComponent::snapshot)
                .forEach(item::addComponent);

        return item;
    }

    void assignTo(Order order) {
        this.order = order;
    }

    private void addComponent(OrderItemComponent component) {
        component.assignTo(this);
        this.components.add(component);
    }
}
