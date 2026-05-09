package com.cj.restaurantbook.admin_calendar.application;

import com.cj.restaurantbook.admin_calendar.domain.AdminCalendarEntry;
import com.cj.restaurantbook.admin_calendar.domain.AdminCalendarEntryType;
import com.cj.restaurantbook.admin_calendar.infrastructure.AdminCalendarEntryRepository;
import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminCalendarService {

    private static final long MAX_RANGE_DAYS = 95;

    private final AdminCalendarEntryRepository repository;

    public List<AdminCalendarEntry> listInRange(LocalDate from, LocalDate to) {
        if (from == null || to == null || to.isBefore(from)) {
            throw new BusinessException(ErrorCode.ADMIN_CALENDAR_INVALID_RANGE);
        }
        if (ChronoUnit.DAYS.between(from, to) > MAX_RANGE_DAYS) {
            throw new BusinessException(ErrorCode.ADMIN_CALENDAR_RANGE_TOO_WIDE);
        }
        return repository.findInRange(from, to);
    }

    @Transactional
    public AdminCalendarEntry create(
            LocalDate scheduleDate,
            AdminCalendarEntryType type,
            String title,
            String timeText,
            String content,
            Long createdBy,
            String createdByName
    ) {
        validateTitle(title);
        return repository.save(AdminCalendarEntry.create(
                scheduleDate,
                type,
                title.trim(),
                timeText,
                content,
                createdBy,
                createdByName
        ));
    }

    @Transactional
    public AdminCalendarEntry update(
            Long id,
            LocalDate scheduleDate,
            AdminCalendarEntryType type,
            String title,
            String timeText,
            String content,
            Long updatedBy
    ) {
        validateTitle(title);
        AdminCalendarEntry entry = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ADMIN_CALENDAR_ENTRY_NOT_FOUND));
        entry.update(scheduleDate, type, title.trim(), timeText, content, updatedBy);
        return entry;
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new BusinessException(ErrorCode.ADMIN_CALENDAR_ENTRY_NOT_FOUND);
        }
        repository.deleteById(id);
    }

    private void validateTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new BusinessException(ErrorCode.ADMIN_CALENDAR_TITLE_REQUIRED);
        }
    }
}
