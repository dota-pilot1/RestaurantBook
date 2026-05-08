package com.cj.restaurantbook.staff_call.application;

import com.cj.restaurantbook.websocket.AppWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class StaffCallBroadcaster {

    public static final String TOPIC_OPERATIONS = "staff-calls:operations";
    public static final String EVENT_STAFF_CALL_LIST_CHANGED = "STAFF_CALL_LIST_CHANGED";
    public static final String EVENT_CUSTOMER_CALLS_CHANGED = "CUSTOMER_CALLS_CHANGED";

    private static final String CUSTOMER_TOPIC_PREFIX = "customer:calls/";

    private final AppWebSocketHandler webSocketHandler;

    public void broadcastChangedAfterCommit(String reason, Long callId, String tableName) {
        Runnable broadcast = () -> {
            Map<String, Object> operationsPayload = new HashMap<>();
            operationsPayload.put("reason", reason);
            if (callId != null) {
                operationsPayload.put("callId", callId);
            }
            if (tableName != null && !tableName.isBlank()) {
                operationsPayload.put("tableName", tableName);
            }
            webSocketHandler.broadcastStaffCallListChanged(operationsPayload);

            if (tableName != null && !tableName.isBlank()) {
                Map<String, Object> customerPayload = new HashMap<>();
                customerPayload.put("reason", reason);
                if (callId != null) {
                    customerPayload.put("callId", callId);
                }
                webSocketHandler.broadcastCustomerCallsChanged(customerTopic(tableName), customerPayload);
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
