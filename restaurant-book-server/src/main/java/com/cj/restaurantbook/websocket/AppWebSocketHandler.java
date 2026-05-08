package com.cj.restaurantbook.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
public class AppWebSocketHandler extends TextWebSocketHandler {

    private static final String TOPIC_OPERATIONS = "orders:operations";
    private static final String TOPIC_CUSTOMER_ORDERS_PREFIX = "customer:orders/";
    private static final String TOPIC_STAFF_CALLS = "staff-calls:operations";
    private static final String TOPIC_CUSTOMER_CALLS_PREFIX = "customer:calls/";

    private final ObjectMapper objectMapper;

    private final ConcurrentHashMap<String, CopyOnWriteArrayList<WebSocketSession>> topicSessions =
            new ConcurrentHashMap<>();

    public AppWebSocketHandler(@Lazy ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("WS connected: sessionId={} role={}", session.getId(), session.getAttributes().get("role"));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        topicSessions.forEach((topic, sessions) -> {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                topicSessions.remove(topic, sessions);
            }
        });
        log.info("WS disconnected: sessionId={} status={}", session.getId(), status);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            WsMessage wsMessage = objectMapper.readValue(message.getPayload(), WsMessage.class);
            String type = wsMessage.getType();
            String topic = wsMessage.getTopic();
            if (type == null) {
                return;
            }

            switch (type) {
                case "SUBSCRIBE" -> handleSubscribe(session, topic);
                case "UNSUBSCRIBE" -> handleUnsubscribe(session, topic);
                case "PING" -> sendToSession(session, new WsMessage("PONG", null, null));
                default -> log.warn("Unknown WS message type: {}", type);
            }
        } catch (Exception e) {
            log.warn("WS message handling failed: {}", e.getMessage());
        }
    }

    private void handleSubscribe(WebSocketSession session, String topic) {
        if (topic == null || topic.isBlank()) {
            return;
        }
        if (TOPIC_OPERATIONS.equals(topic) && !canSubscribeOperations(session)) {
            sendToSession(session, new WsMessage("ERROR", topic, Map.of("message", "FORBIDDEN")));
            return;
        }
        if (TOPIC_STAFF_CALLS.equals(topic) && !canSubscribeStaffCalls(session)) {
            sendToSession(session, new WsMessage("ERROR", topic, Map.of("message", "FORBIDDEN")));
            return;
        }

        boolean supported = TOPIC_OPERATIONS.equals(topic)
                || TOPIC_STAFF_CALLS.equals(topic)
                || topic.startsWith(TOPIC_CUSTOMER_ORDERS_PREFIX)
                || topic.startsWith(TOPIC_CUSTOMER_CALLS_PREFIX);
        if (!supported) {
            sendToSession(session, new WsMessage("ERROR", topic, Map.of("message", "UNSUPPORTED_TOPIC")));
            return;
        }

        CopyOnWriteArrayList<WebSocketSession> sessions =
                topicSessions.computeIfAbsent(topic, ignored -> new CopyOnWriteArrayList<>());
        if (!sessions.contains(session)) {
            sessions.add(session);
        }
    }

    private void handleUnsubscribe(WebSocketSession session, String topic) {
        if (topic == null) {
            return;
        }
        CopyOnWriteArrayList<WebSocketSession> sessions = topicSessions.get(topic);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                topicSessions.remove(topic, sessions);
            }
        }
    }

    private boolean canSubscribeOperations(WebSocketSession session) {
        Object roleObj = session.getAttributes().get("role");
        String role = roleObj == null ? "" : roleObj.toString();
        return "ROLE_ADMIN".equals(role)
                || "ROLE_MANAGER".equals(role)
                || "ROLE_KITCHEN".equals(role)
                || "ROLE_STAFF".equals(role);
    }

    private boolean canSubscribeStaffCalls(WebSocketSession session) {
        Object roleObj = session.getAttributes().get("role");
        String role = roleObj == null ? "" : roleObj.toString();
        return "ROLE_ADMIN".equals(role)
                || "ROLE_MANAGER".equals(role)
                || "ROLE_STAFF".equals(role);
    }

    private void sendToSession(WebSocketSession session, WsMessage message) {
        if (!session.isOpen()) {
            return;
        }
        try {
            synchronized (session) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
            }
        } catch (Exception e) {
            log.warn("WS send failed: sessionId={} err={}", session.getId(), e.getMessage());
        }
    }

    public void broadcastOrderListChanged(Object payload) {
        broadcast(TOPIC_OPERATIONS, new WsMessage("ORDER_LIST_CHANGED", TOPIC_OPERATIONS, payload));
    }

    public void broadcastCustomerOrdersChanged(String topic, Object payload) {
        broadcast(topic, new WsMessage("CUSTOMER_ORDERS_CHANGED", topic, payload));
    }

    public void broadcastStaffCallListChanged(Object payload) {
        broadcast(TOPIC_STAFF_CALLS, new WsMessage("STAFF_CALL_LIST_CHANGED", TOPIC_STAFF_CALLS, payload));
    }

    public void broadcastCustomerCallsChanged(String topic, Object payload) {
        broadcast(topic, new WsMessage("CUSTOMER_CALLS_CHANGED", topic, payload));
    }

    public void broadcast(String topic, WsMessage message) {
        CopyOnWriteArrayList<WebSocketSession> sessions = topicSessions.get(topic);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        try {
            TextMessage textMessage = new TextMessage(objectMapper.writeValueAsString(message));
            List<WebSocketSession> deadSessions = new ArrayList<>();
            for (WebSocketSession session : sessions) {
                if (!session.isOpen()) {
                    deadSessions.add(session);
                    continue;
                }
                try {
                    synchronized (session) {
                        session.sendMessage(textMessage);
                    }
                } catch (IOException e) {
                    deadSessions.add(session);
                }
            }
            sessions.removeAll(deadSessions);
        } catch (Exception e) {
            log.warn("WS broadcast failed: topic={} type={} err={}", topic, message.getType(), e.getMessage());
        }
    }
}
