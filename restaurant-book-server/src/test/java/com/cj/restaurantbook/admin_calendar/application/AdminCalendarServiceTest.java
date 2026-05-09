package com.cj.restaurantbook.admin_calendar.application;

import com.cj.restaurantbook.admin_calendar.domain.AdminCalendarEntry;
import com.cj.restaurantbook.admin_calendar.domain.AdminCalendarEntryType;
import com.cj.restaurantbook.admin_calendar.infrastructure.AdminCalendarEntryRepository;
import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AdminCalendarServiceTest {

    private final AdminCalendarEntryRepository repository = mock(AdminCalendarEntryRepository.class);
    private final AdminCalendarService service = new AdminCalendarService(repository);

    @Test
    void listInRangeRejectsReverseRange() {
        assertBusinessError(
                () -> service.listInRange(LocalDate.of(2026, 5, 2), LocalDate.of(2026, 5, 1)),
                ErrorCode.ADMIN_CALENDAR_INVALID_RANGE
        );
    }

    @Test
    void listInRangeRejectsTooWideRange() {
        assertBusinessError(
                () -> service.listInRange(LocalDate.of(2026, 5, 1), LocalDate.of(2026, 8, 5)),
                ErrorCode.ADMIN_CALENDAR_RANGE_TOO_WIDE
        );
    }

    @Test
    void createRejectsBlankTitle() {
        assertBusinessError(
                () -> service.create(
                        LocalDate.of(2026, 5, 1),
                        AdminCalendarEntryType.NOTICE,
                        "  ",
                        null,
                        null,
                        1L,
                        "admin@restaurantbook.local"
                ),
                ErrorCode.ADMIN_CALENDAR_TITLE_REQUIRED
        );
    }

    @Test
    void updateAndDeleteRejectMissingEntry() {
        when(repository.findById(404L)).thenReturn(Optional.empty());
        when(repository.existsById(404L)).thenReturn(false);

        assertBusinessError(
                () -> service.update(
                        404L,
                        LocalDate.of(2026, 5, 1),
                        AdminCalendarEntryType.EVENT,
                        "프로모션",
                        null,
                        null,
                        1L
                ),
                ErrorCode.ADMIN_CALENDAR_ENTRY_NOT_FOUND
        );
        assertBusinessError(
                () -> service.delete(404L),
                ErrorCode.ADMIN_CALENDAR_ENTRY_NOT_FOUND
        );
    }

    private void assertBusinessError(Runnable action, ErrorCode expected) {
        assertThatThrownBy(action::run)
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(expected);
    }
}
