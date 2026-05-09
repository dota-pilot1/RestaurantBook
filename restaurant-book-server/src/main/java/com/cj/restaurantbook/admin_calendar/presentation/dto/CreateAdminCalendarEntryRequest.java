package com.cj.restaurantbook.admin_calendar.presentation.dto;

import com.cj.restaurantbook.admin_calendar.domain.AdminCalendarEntryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateAdminCalendarEntryRequest(
        @NotNull LocalDate scheduleDate,
        @NotNull AdminCalendarEntryType type,
        @NotBlank @Size(max = 120) String title,
        @Size(max = 40) String timeText,
        @Size(max = 4000) String content
) {}
