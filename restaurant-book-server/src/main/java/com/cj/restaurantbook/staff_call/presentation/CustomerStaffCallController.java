package com.cj.restaurantbook.staff_call.presentation;

import com.cj.restaurantbook.staff_call.application.StaffCallService;
import com.cj.restaurantbook.staff_call.presentation.dto.CancelStaffCallRequest;
import com.cj.restaurantbook.staff_call.presentation.dto.CreateStaffCallRequest;
import com.cj.restaurantbook.staff_call.presentation.dto.StaffCallResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

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
