package com.cj.restaurantbook.admin_calendar.presentation.dto;

import com.cj.restaurantbook.admin_calendar.domain.AdminCalendarEntry;
import com.cj.restaurantbook.admin_calendar.domain.AdminCalendarEntryType;

import java.time.Instant;
import java.time.LocalDate;

public record AdminCalendarEntryResponse(
        Long id,
        LocalDate scheduleDate,
        AdminCalendarEntryType type,
        String title,
        String timeText,
        String content,
        Long createdBy,
        String createdByName,
        Long updatedBy,
        Instant createdAt,
        Instant updatedAt
) {
    public static AdminCalendarEntryResponse from(AdminCalendarEntry entry) {
        return new AdminCalendarEntryResponse(
                entry.getId(),
                entry.getScheduleDate(),
                entry.getType(),
                entry.getTitle(),
                entry.getTimeText(),
                entry.getContent(),
                entry.getCreatedBy(),
                entry.getCreatedByName(),
                entry.getUpdatedBy(),
                entry.getCreatedAt(),
                entry.getUpdatedAt()
        );
    }
}
