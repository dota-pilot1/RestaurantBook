package com.cj.restaurantbook.order.application;

import com.cj.restaurantbook.websocket.AppWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OrderBroadcaster {

    public static final String TOPIC_OPERATIONS = "orders:operations";
    public static final String EVENT_ORDER_LIST_CHANGED = "ORDER_LIST_CHANGED";
    public static final String EVENT_CUSTOMER_ORDERS_CHANGED = "CUSTOMER_ORDERS_CHANGED";

    private static final String CUSTOMER_TOPIC_PREFIX = "customer:orders/";

    private final AppWebSocketHandler webSocketHandler;

    public void broadcastOrderChangedAfterCommit(String reason, Long orderId, String tableName) {
        broadcastOrderChangedAfterCommit(reason, orderId, tableName, null);
    }

    public void broadcastOrderChangedAfterCommit(String reason, Long orderId, String tableName, String cancelMessage) {
        Runnable broadcast = () -> {
            Map<String, Object> operationsPayload = new HashMap<>();
            operationsPayload.put("reason", reason);
            if (orderId != null) {
                operationsPayload.put("orderId", orderId);
            }
            if (tableName != null && !tableName.isBlank()) {
                operationsPayload.put("tableName", tableName);
            }
            if (cancelMessage != null && !cancelMessage.isBlank()) {
                operationsPayload.put("cancelMessage", cancelMessage);
            }
            webSocketHandler.broadcastOrderListChanged(operationsPayload);

            if (tableName != null && !tableName.isBlank()) {
                Map<String, Object> customerPayload = new HashMap<>();
                customerPayload.put("reason", reason);
                if (orderId != null) {
                    customerPayload.put("orderId", orderId);
                }
                if (cancelMessage != null && !cancelMessage.isBlank()) {
                    customerPayload.put("cancelMessage", cancelMessage);
                }
                webSocketHandler.broadcastCustomerOrdersChanged(customerTopic(tableName), customerPayload);
            }
        };

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            broadcast.run();
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                broadcast.run();
            }
        });
    }

    private String customerTopic(String tableName) {
        return CUSTOMER_TOPIC_PREFIX + tableName;
    }
}
