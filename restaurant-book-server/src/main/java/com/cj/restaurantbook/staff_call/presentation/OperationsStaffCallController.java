package com.cj.restaurantbook.staff_call.presentation;

import com.cj.restaurantbook.auth.security.UserPrincipal;
import com.cj.restaurantbook.staff_call.application.StaffCallService;
import com.cj.restaurantbook.staff_call.presentation.dto.StaffCallResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    @Operation(summary = "직원 호출 확인 처리")
    public StaffCallResponse acknowledge(
            @PathVariable Long callId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long handledBy = principal == null ? null : principal.getId();
        return staffCallService.acknowledge(callId, handledBy);
    }
}
