package com.cj.restaurantbook.admin_calendar.presentation;

import com.cj.restaurantbook.admin_calendar.application.AdminCalendarService;
import com.cj.restaurantbook.admin_calendar.presentation.dto.AdminCalendarEntryResponse;
import com.cj.restaurantbook.admin_calendar.presentation.dto.CreateAdminCalendarEntryRequest;
import com.cj.restaurantbook.admin_calendar.presentation.dto.UpdateAdminCalendarEntryRequest;
import com.cj.restaurantbook.auth.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@Tag(name = "운영 일정 관리")
@RestController
@RequestMapping("/api/admin/calendar")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCalendarController {

    private final AdminCalendarService service;

    @GetMapping("/entries")
    @Operation(summary = "운영 일정 목록 조회")
    public List<AdminCalendarEntryResponse> list(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return service.listInRange(from, to).stream()
                .map(AdminCalendarEntryResponse::from)
                .toList();
    }

    @PostMapping("/entries")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "운영 일정 등록")
    public AdminCalendarEntryResponse create(
            @Valid @RequestBody CreateAdminCalendarEntryRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return AdminCalendarEntryResponse.from(service.create(
                request.scheduleDate(),
                request.type(),
                request.title(),
                request.timeText(),
                request.content(),
                principal.getId(),
                displayName(principal)
        ));
    }

    @PutMapping("/entries/{id}")
    @Operation(summary = "운영 일정 수정")
    public AdminCalendarEntryResponse update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAdminCalendarEntryRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return AdminCalendarEntryResponse.from(service.update(
                id,
                request.scheduleDate(),
                request.type(),
                request.title(),
                request.timeText(),
                request.content(),
                principal.getId()
        ));
    }

    @DeleteMapping("/entries/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "운영 일정 삭제")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    private String displayName(UserPrincipal principal) {
        String email = principal.getEmail();
        return email == null || email.isBlank() ? "관리자" : email;
    }
}
