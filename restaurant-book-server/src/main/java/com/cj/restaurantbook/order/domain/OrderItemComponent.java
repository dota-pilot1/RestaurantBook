package com.cj.restaurantbook.order.domain;

import com.cj.restaurantbook.sale_menu_set.domain.SaleMenuSetItem;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "order_item_components")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItemComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @Column
    private Long saleMenuId;

    @Column(nullable = false, length = 100)
    private String componentName;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private int displayOrder;

    public static OrderItemComponent snapshot(SaleMenuSetItem item) {
        OrderItemComponent component = new OrderItemComponent();
        component.saleMenuId = item.getSaleMenu().getId();
        component.componentName = item.getSaleMenu().getName();
        component.quantity = item.getQuantity();
        component.displayOrder = item.getDisplayOrder();
        return component;
    }

    void assignTo(OrderItem orderItem) {
        this.orderItem = orderItem;
    }
}
