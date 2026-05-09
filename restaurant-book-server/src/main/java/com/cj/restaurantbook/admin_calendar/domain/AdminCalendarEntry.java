package com.cj.restaurantbook.admin_calendar.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        name = "admin_calendar_entries",
        indexes = {
                @Index(name = "idx_admin_calendar_entries_date", columnList = "schedule_date"),
                @Index(name = "idx_admin_calendar_entries_date_type", columnList = "schedule_date,type")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AdminCalendarEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "schedule_date", nullable = false)
    private LocalDate scheduleDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AdminCalendarEntryType type;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(name = "time_text", length = 40)
    private String timeText;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "created_by_name", length = 200)
    private String createdByName;

    @Column(name = "updated_by")
    private Long updatedBy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static AdminCalendarEntry create(
            LocalDate scheduleDate,
            AdminCalendarEntryType type,
            String title,
            String timeText,
            String content,
            Long createdBy,
            String createdByName
    ) {
        AdminCalendarEntry entry = new AdminCalendarEntry();
        entry.scheduleDate = scheduleDate;
        entry.type = type;
        entry.title = title;
        entry.timeText = blankToNull(timeText);
        entry.content = blankToNull(content);
        entry.createdBy = createdBy;
        entry.createdByName = blankToNull(createdByName);
        return entry;
    }

    public void update(
            LocalDate scheduleDate,
            AdminCalendarEntryType type,
            String title,
            String timeText,
            String content,
            Long updatedBy
    ) {
        this.scheduleDate = scheduleDate;
        this.type = type;
        this.title = title;
        this.timeText = blankToNull(timeText);
        this.content = blankToNull(content);
        this.updatedBy = updatedBy;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
