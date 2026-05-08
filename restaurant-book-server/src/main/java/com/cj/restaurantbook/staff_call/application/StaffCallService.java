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
