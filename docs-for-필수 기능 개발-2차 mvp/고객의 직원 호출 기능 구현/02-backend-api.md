# 02. 백엔드 API / Service / WebSocket

작성일: 2026-05-08

기존 Order 도메인의 분리 패턴 (`OrderController` ↔ `OperationsOrderController`)을 그대로 반영한다.

## 1. WebSocket 토픽 추가

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/websocket/AppWebSocketHandler.java`

기존 토픽 상수 옆에 추가.

```java
private static final String TOPIC_OPERATIONS = "orders:operations";
private static final String TOPIC_CUSTOMER_ORDERS_PREFIX = "customer:orders/";
private static final String TOPIC_STAFF_CALLS = "staff-calls:operations";          // 추가
private static final String TOPIC_CUSTOMER_CALLS_PREFIX = "customer:calls/";       // 추가
```

`handleSubscribe`의 권한/접두어 검사를 확장한다.

```java
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
```

키친 롤은 호출 응대 책임이 없으므로 제외한다.

```java
private boolean canSubscribeStaffCalls(WebSocketSession session) {
    Object roleObj = session.getAttributes().get("role");
    String role = roleObj == null ? "" : roleObj.toString();
    return "ROLE_ADMIN".equals(role)
            || "ROLE_MANAGER".equals(role)
            || "ROLE_STAFF".equals(role);
}
```

브로드캐스트 헬퍼 추가.

```java
public void broadcastStaffCallListChanged(Object payload) {
    broadcast(TOPIC_STAFF_CALLS, new WsMessage("STAFF_CALL_LIST_CHANGED", TOPIC_STAFF_CALLS, payload));
}

public void broadcastCustomerCallsChanged(String topic, Object payload) {
    broadcast(topic, new WsMessage("CUSTOMER_CALLS_CHANGED", topic, payload));
}
```

## 2. StaffCallBroadcaster

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/staff_call/application/StaffCallBroadcaster.java`

`OrderBroadcaster`와 동일하게 `TransactionSynchronizationManager.afterCommit()`을 사용한다.

```java
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
```

`reason` 값: `CREATED`, `ACKNOWLEDGED`, `CANCELED`.

## 3. DTO

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/staff_call/presentation/dto/CreateStaffCallRequest.java`

```java
package com.cj.restaurantbook.staff_call.presentation.dto;

import com.cj.restaurantbook.staff_call.domain.StaffCallType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateStaffCallRequest(
        @NotBlank @Size(max = 80) String tableName,
        StaffCallType type,
        @Size(max = 200) String message
) {
}
```

파일: `.../dto/StaffCallResponse.java`

```java
package com.cj.restaurantbook.staff_call.presentation.dto;

import com.cj.restaurantbook.staff_call.domain.StaffCall;
import com.cj.restaurantbook.staff_call.domain.StaffCallStatus;
import com.cj.restaurantbook.staff_call.domain.StaffCallType;

import java.time.Instant;

public record StaffCallResponse(
        Long id,
        String tableName,
        StaffCallType type,
        String message,
        StaffCallStatus status,
        Instant acknowledgedAt,
        Long acknowledgedBy,
        Instant createdAt,
        Instant updatedAt
) {
    public static StaffCallResponse from(StaffCall call) {
        return new StaffCallResponse(
                call.getId(),
                call.getTableName(),
                call.getType(),
                call.getMessage(),
                call.getStatus(),
                call.getAcknowledgedAt(),
                call.getAcknowledgedBy(),
                call.getCreatedAt(),
                call.getUpdatedAt()
        );
    }
}
```

파일: `.../dto/CancelStaffCallRequest.java`

```java
package com.cj.restaurantbook.staff_call.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelStaffCallRequest(
        @NotBlank @Size(max = 80) String tableName
) {
}
```

## 4. StaffCallService

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/staff_call/application/StaffCallService.java`

```java
package com.cj.restaurantbook.staff_call.application;

import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import com.cj.restaurantbook.staff_call.domain.StaffCall;
import com.cj.restaurantbook.staff_call.domain.StaffCallStatus;
import com.cj.restaurantbook.staff_call.domain.StaffCallType;
import com.cj.restaurantbook.staff_call.infrastructure.StaffCallRepository;
import com.cj.restaurantbook.staff_call.presentation.dto.StaffCallResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StaffCallService {

    private static final Duration DUPLICATE_THRESHOLD = Duration.ofMinutes(1);

    private final StaffCallRepository staffCallRepository;
    private final StaffCallBroadcaster staffCallBroadcaster;

    @Transactional
    public StaffCallResponse createCustomerCall(String tableName, StaffCallType type, String message) {
        String normalized = normalizeTableName(tableName);
        if (normalized == null) {
            throw new BusinessException(ErrorCode.STAFF_CALL_TABLE_REQUIRED);
        }

        Instant threshold = Instant.now().minus(DUPLICATE_THRESHOLD);
        if (staffCallRepository.existsByTableNameAndStatusAndCreatedAtGreaterThanEqual(
                normalized, StaffCallStatus.PENDING, threshold)) {
            throw new BusinessException(ErrorCode.STAFF_CALL_DUPLICATE);
        }

        StaffCall saved = staffCallRepository.save(StaffCall.create(normalized, type, message));
        staffCallBroadcaster.broadcastChangedAfterCommit("CREATED", saved.getId(), saved.getTableName());
        return StaffCallResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<StaffCallResponse> findActiveCustomerCalls(String tableName) {
        String normalized = normalizeTableName(tableName);
        if (normalized == null) {
            return List.of();
        }
        return staffCallRepository
                .findByTableNameAndStatusOrderByCreatedAtAscIdAsc(normalized, StaffCallStatus.PENDING)
                .stream()
                .map(StaffCallResponse::from)
                .toList();
    }

    @Transactional
    public void cancelCustomerCall(Long callId, String tableName) {
        String normalized = normalizeTableName(tableName);
        if (normalized == null) {
            throw new BusinessException(ErrorCode.STAFF_CALL_TABLE_REQUIRED);
        }

        StaffCall call = staffCallRepository.findById(callId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STAFF_CALL_NOT_FOUND));

        if (!normalized.equals(call.getTableName())) {
            throw new BusinessException(ErrorCode.STAFF_CALL_TABLE_MISMATCH);
        }

        try {
            call.cancel();
        } catch (IllegalStateException e) {
            throw new BusinessException(ErrorCode.STAFF_CALL_STATUS_TRANSITION_NOT_ALLOWED);
        }
        staffCallBroadcaster.broadcastChangedAfterCommit("CANCELED", call.getId(), call.getTableName());
    }

    @Transactional(readOnly = true)
    public List<StaffCallResponse> findPendingCalls() {
        return staffCallRepository
                .findByStatusOrderByCreatedAtAscIdAsc(StaffCallStatus.PENDING)
                .stream()
                .map(StaffCallResponse::from)
                .toList();
    }

    @Transactional
    public StaffCallResponse acknowledge(Long callId, Long handledBy) {
        StaffCall call = staffCallRepository.findForUpdateById(callId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STAFF_CALL_NOT_FOUND));
        try {
            call.acknowledge(handledBy);
        } catch (IllegalStateException e) {
            throw new BusinessException(ErrorCode.STAFF_CALL_STATUS_TRANSITION_NOT_ALLOWED);
        }
        staffCallBroadcaster.broadcastChangedAfterCommit("ACKNOWLEDGED", call.getId(), call.getTableName());
        return StaffCallResponse.from(call);
    }

    private String normalizeTableName(String tableName) {
        if (tableName == null) {
            return null;
        }
        String normalized = tableName.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        return normalized.length() > 80 ? normalized.substring(0, 80) : normalized;
    }
}
```

> Order 도메인의 `normalizeTableName` 로직과 동일. 추후 공통화 가능하지만 MVP에서는 도메인별로 보유.

## 5. CustomerStaffCallController

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/staff_call/presentation/CustomerStaffCallController.java`

```java
package com.cj.restaurantbook.staff_call.presentation;

import com.cj.restaurantbook.staff_call.application.StaffCallService;
import com.cj.restaurantbook.staff_call.presentation.dto.CancelStaffCallRequest;
import com.cj.restaurantbook.staff_call.presentation.dto.CreateStaffCallRequest;
import com.cj.restaurantbook.staff_call.presentation.dto.StaffCallResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/customer/staff-calls")
public class CustomerStaffCallController {

    private final StaffCallService staffCallService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StaffCallResponse create(@Valid @RequestBody CreateStaffCallRequest request) {
        return staffCallService.createCustomerCall(request.tableName(), request.type(), request.message());
    }

    @GetMapping("/active")
    public List<StaffCallResponse> active(@RequestParam String tableName) {
        return staffCallService.findActiveCustomerCalls(tableName);
    }

    @PatchMapping("/{callId}/cancel")
    public void cancel(
            @PathVariable Long callId,
            @Valid @RequestBody CancelStaffCallRequest request
    ) {
        staffCallService.cancelCustomerCall(callId, request.tableName());
    }
}
```

> 보안 설정에서 `/api/customer/**`가 허용되어 있는지 확인. (Order의 `/api/customer/orders`가 공개되어 있으므로 동일 패턴.)

## 6. OperationsStaffCallController

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/staff_call/presentation/OperationsStaffCallController.java`

```java
package com.cj.restaurantbook.staff_call.presentation;

import com.cj.restaurantbook.auth.security.UserPrincipal;
import com.cj.restaurantbook.staff_call.application.StaffCallService;
import com.cj.restaurantbook.staff_call.presentation.dto.StaffCallResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/operations/staff-calls")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
@Tag(name = "Operations Staff Calls", description = "직원 호출 응대")
public class OperationsStaffCallController {

    private final StaffCallService staffCallService;

    @GetMapping
    @Operation(summary = "미처리 호출 목록 조회")
    public List<StaffCallResponse> pending() {
        return staffCallService.findPendingCalls();
    }

    @PatchMapping("/{callId}/acknowledge")
    @Operation(summary = "호출 확인 처리")
    public StaffCallResponse acknowledge(
            @PathVariable Long callId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long handledBy = principal == null ? null : principal.getId();
        return staffCallService.acknowledge(callId, handledBy);
    }
}
```

> 매니저는 응대까지 갈 수도 있어 `MANAGER` 롤도 acknowledge 권한에 포함했다. 정책에 따라 STAFF만 처리하게 하려면 `acknowledge`만 별도 `@PreAuthorize`로 제한한다.

## 7. ManagerDashboardService 확장

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/manager/application/ManagerDashboardService.java`

```java
private final OrderRepository orderRepository;
private final StaffCallRepository staffCallRepository;   // 추가

@Transactional(readOnly = true)
public ManagerDashboardResponse getDashboard() {
    LocalDate today = LocalDate.now(BUSINESS_ZONE);
    Instant start = today.atStartOfDay(BUSINESS_ZONE).toInstant();
    Instant end = today.plusDays(1).atStartOfDay(BUSINESS_ZONE).toInstant();

    return new ManagerDashboardResponse(
            orderRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(start, end),
            orderRepository.countByStatus(OrderStatus.RECEIVED),
            orderRepository.countByStatus(OrderStatus.ACCEPTED),
            orderRepository.countByStatus(OrderStatus.COOKING),
            orderRepository.countByStatus(OrderStatus.READY),
            orderRepository.countByStatusAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                    OrderStatus.CANCELED, start, end
            ),
            staffCallRepository.countByStatus(StaffCallStatus.PENDING)   // 추가
    );
}
```

`ManagerDashboardResponse`에도 필드 추가.

```java
public record ManagerDashboardResponse(
        long todayOrderCount,
        long receivedCount,
        long acceptedCount,
        long cookingCount,
        long readyCount,
        long canceledTodayCount,
        long pendingStaffCallCount    // 추가
) {}
```

## 8. API 명세 요약

| 엔드포인트 | 메서드 | 권한 | 본문 / 파라미터 | 응답 |
|------------|--------|------|---------------|------|
| `/api/customer/staff-calls` | POST | 익명 | `{ tableName, type?, message? }` | `StaffCallResponse` |
| `/api/customer/staff-calls/active` | GET | 익명 | `?tableName=` | `StaffCallResponse[]` |
| `/api/customer/staff-calls/{id}/cancel` | PATCH | 익명 | `{ tableName }` | 204 |
| `/api/operations/staff-calls` | GET | ADMIN/MANAGER/STAFF | - | `StaffCallResponse[]` |
| `/api/operations/staff-calls/{id}/acknowledge` | PATCH | ADMIN/MANAGER/STAFF | - | `StaffCallResponse` |
| `/api/manager/dashboard` | GET | ADMIN/MANAGER | - | `ManagerDashboardResponse` (필드 추가) |

## 9. WebSocket 이벤트 요약

| 이벤트 | 토픽 | 페이로드 |
|--------|------|---------|
| `STAFF_CALL_LIST_CHANGED` | `staff-calls:operations` | `{ reason, callId, tableName }` |
| `CUSTOMER_CALLS_CHANGED` | `customer:calls/{tableName}` | `{ reason, callId }` |

`reason` 값: `CREATED` / `ACKNOWLEDGED` / `CANCELED`.

## 완료 기준

- 고객이 호출 생성 시 `staff-calls:operations` 토픽으로 `CREATED` 이벤트가 전파된다.
- 같은 테이블에서 1분 내 `PENDING` 상태인 동안 또 호출하면 409가 응답된다.
- 직원/매니저가 acknowledge 시 `customer:calls/{tableName}`로 `ACKNOWLEDGED` 이벤트가 전파된다.
- 비로그인 채널은 `staff-calls:operations` 구독이 거부된다 (`FORBIDDEN`).
- 매니저 대시보드 응답에 `pendingStaffCallCount`가 포함된다.
