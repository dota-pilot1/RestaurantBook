package com.cj.restaurantbook.admin_calendar.infrastructure;

import com.cj.restaurantbook.admin_calendar.domain.AdminCalendarEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AdminCalendarEntryRepository extends JpaRepository<AdminCalendarEntry, Long> {

    @Query("""
            select e from AdminCalendarEntry e
            where e.scheduleDate between :from and :to
            order by e.scheduleDate asc, e.id asc
            """)
    List<AdminCalendarEntry> findInRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );
}
