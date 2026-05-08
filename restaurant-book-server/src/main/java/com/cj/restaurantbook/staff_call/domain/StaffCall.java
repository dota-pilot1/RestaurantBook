package com.cj.restaurantbook.staff_call.domain;

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

@Entity
@Table(name = "staff_calls", indexes = {
        @Index(name = "idx_staff_calls_status", columnList = "status"),
        @Index(name = "idx_staff_calls_table_status", columnList = "table_name, status")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StaffCall {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "table_name", nullable = false, length = 80)
    private String tableName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StaffCallType type;

    @Column(length = 200)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StaffCallStatus status = StaffCallStatus.PENDING;

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(name = "acknowledged_by")
    private Long acknowledgedBy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static StaffCall create(String tableName, StaffCallType type, String message) {
        StaffCall call = new StaffCall();
        call.tableName = tableName;
        call.type = type == null ? StaffCallType.GENERAL : type;
        call.message = normalizeMessage(message);
        call.status = StaffCallStatus.PENDING;
        return call;
    }

    public void acknowledge(Long userId) {
        if (this.status != StaffCallStatus.PENDING) {
            throw new IllegalStateException(
                    "Invalid staff call transition: " + this.status + " -> ACKNOWLEDGED");
        }
        this.status = StaffCallStatus.ACKNOWLEDGED;
        this.acknowledgedAt = Instant.now();
        this.acknowledgedBy = userId;
    }

    public void cancel() {
        if (this.status != StaffCallStatus.PENDING) {
            throw new IllegalStateException(
                    "Invalid staff call transition: " + this.status + " -> CANCELED");
        }
        this.status = StaffCallStatus.CANCELED;
    }

    public boolean isPending() {
        return this.status == StaffCallStatus.PENDING;
    }

    private static String normalizeMessage(String message) {
        if (message == null) {
            return null;
        }
        String normalized = message.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        return normalized.length() > 200 ? normalized.substring(0, 200) : normalized;
    }
}
