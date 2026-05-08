# 01. 백엔드 도메인 설계

작성일: 2026-05-08

## 목표

`staff_call` 신규 도메인을 추가한다. Order 도메인의 `OrderBroadcaster`/`OrderSchemaMigrator` 패턴을 그대로 따른다.

## 1. StaffCallStatus

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/staff_call/domain/StaffCallStatus.java`

```java
package com.cj.restaurantbook.staff_call.domain;

public enum StaffCallStatus {
    PENDING,        // 호출 발생, 직원 확인 대기
    ACKNOWLEDGED,   // 직원이 확인 처리
    CANCELED        // 고객이 호출 취소
}
```

## 2. StaffCallType

호출 유형은 운영 의사결정에 도움이 되므로 분리. UI 빠른 선택용.

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/staff_call/domain/StaffCallType.java`

```java
package com.cj.restaurantbook.staff_call.domain;

public enum StaffCallType {
    GENERAL,    // 일반 호출 (기본값)
    REFILL,     // 물/반찬 리필
    QUESTION,   // 메뉴 문의
    PAYMENT,    // 결제 도움
    OTHER       // 기타
}
```

`OTHER`만 메시지 입력을 강제하고 나머지는 메시지 선택으로 한다(앱 측 검증).
백엔드는 `type`은 nullable 불가, `message`는 nullable 허용으로만 검증.

## 3. StaffCall 엔티티

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/staff_call/domain/StaffCall.java`

```java
package com.cj.restaurantbook.staff_call.domain;

import jakarta.persistence.*;
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
```

### 설계 선택 근거

| 항목 | 선택 | 근거 |
|------|------|------|
| `tableName` String 사용 | RestaurantTable FK 안 씀 | 기존 `Order.tableName` 패턴 그대로. 테이블이 사라져도 호출 이력 보존 가능 |
| `acknowledgedBy` `Long` (User FK 없음) | Soft 참조 | `Payment.handledBy` 동일 패턴 |
| 인덱스 | `(status)`, `(table_name, status)` | 운영 보드는 `status=PENDING` 조회, 고객은 `table_name + status` 조회 |
| 메시지 200자 | `varchar(200)` | UX 상 한 화면에 보이는 길이 |

## 4. StaffCallRepository

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/staff_call/infrastructure/StaffCallRepository.java`

```java
package com.cj.restaurantbook.staff_call.infrastructure;

import com.cj.restaurantbook.staff_call.domain.StaffCall;
import com.cj.restaurantbook.staff_call.domain.StaffCallStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface StaffCallRepository extends JpaRepository<StaffCall, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<StaffCall> findForUpdateById(Long id);

    List<StaffCall> findByStatusOrderByCreatedAtAscIdAsc(StaffCallStatus status);

    List<StaffCall> findByTableNameAndStatusOrderByCreatedAtAscIdAsc(
            String tableName,
            StaffCallStatus status
    );

    boolean existsByTableNameAndStatusAndCreatedAtGreaterThanEqual(
            String tableName,
            StaffCallStatus status,
            Instant createdAtThreshold
    );

    long countByStatus(StaffCallStatus status);
}
```

`existsByTableNameAndStatusAndCreatedAtGreaterThanEqual`은 1분 내 중복 호출 차단용.

## 5. 스키마 마이그레이터

`OrderSchemaMigrator`와 같은 컨벤션. `ddl-auto: update`로 로컬에서는 자동 생성되지만, 운영 DB 동기화를 위한 보조 장치이다.

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/staff_call/infrastructure/StaffCallSchemaMigrator.java`

```java
package com.cj.restaurantbook.staff_call.infrastructure;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class StaffCallSchemaMigrator implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!isPostgres() || !tableExists("staff_calls")) {
            return;
        }

        syncStatusCheckConstraint();
        syncTypeCheckConstraint();
    }

    private void syncStatusCheckConstraint() {
        jdbcTemplate.execute("alter table staff_calls drop constraint if exists staff_calls_status_check");
        jdbcTemplate.execute("""
                alter table staff_calls
                add constraint staff_calls_status_check
                check (status in ('PENDING', 'ACKNOWLEDGED', 'CANCELED'))
                """);
        log.info("Synchronized staff_calls_status_check constraint");
    }

    private void syncTypeCheckConstraint() {
        jdbcTemplate.execute("alter table staff_calls drop constraint if exists staff_calls_type_check");
        jdbcTemplate.execute("""
                alter table staff_calls
                add constraint staff_calls_type_check
                check (type in ('GENERAL', 'REFILL', 'QUESTION', 'PAYMENT', 'OTHER'))
                """);
        log.info("Synchronized staff_calls_type_check constraint");
    }

    private boolean isPostgres() {
        try {
            String database = jdbcTemplate.queryForObject("select version()", String.class);
            return database != null && database.toLowerCase().contains("postgresql");
        } catch (Exception e) {
            log.debug("Skipping staff_call schema migration", e);
            return false;
        }
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject("""
                select count(*)
                from information_schema.tables
                where table_schema = current_schema()
                  and table_name = ?
                """, Integer.class, tableName);
        return count != null && count > 0;
    }
}
```

## 6. ErrorCode 추가

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/common/exception/ErrorCode.java`

`PAYMENT_*` 다음 위치에 추가.

```java
STAFF_CALL_NOT_FOUND(HttpStatus.NOT_FOUND, "STAFF_CALL_001", "직원 호출을 찾을 수 없습니다."),
STAFF_CALL_TABLE_REQUIRED(HttpStatus.BAD_REQUEST, "STAFF_CALL_002", "테이블 정보가 필요합니다."),
STAFF_CALL_DUPLICATE(HttpStatus.CONFLICT, "STAFF_CALL_003", "이미 호출이 진행 중입니다. 잠시 후 다시 시도해주세요."),
STAFF_CALL_STATUS_TRANSITION_NOT_ALLOWED(HttpStatus.CONFLICT, "STAFF_CALL_004", "현재 호출 상태에서는 처리할 수 없습니다."),
STAFF_CALL_TABLE_MISMATCH(HttpStatus.FORBIDDEN, "STAFF_CALL_005", "테이블 정보가 일치하지 않습니다."),
```

코드 번호 충돌 주의: 기존 ErrorCode 마지막은 `TABLE_002`, `INTERNAL_ERROR`이며 이 사이에 추가하면 된다.

## 7. DB 반영

로컬 개발: `ddl-auto: update`로 자동 반영.

운영 DB 직접 반영용 SQL (참고):

```sql
CREATE TABLE staff_calls (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(80) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('GENERAL', 'REFILL', 'QUESTION', 'PAYMENT', 'OTHER')),
    message VARCHAR(200),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'ACKNOWLEDGED', 'CANCELED')),
    acknowledged_at TIMESTAMP,
    acknowledged_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_calls_status ON staff_calls(status);
CREATE INDEX idx_staff_calls_table_status ON staff_calls(table_name, status);
```

## 완료 기준

- `StaffCall` 엔티티가 PENDING → ACKNOWLEDGED / CANCELED 전이 외 예외를 던진다.
- 빈 메시지/공백 메시지는 자동으로 `null`이 된다.
- 200자 초과 메시지는 잘려서 저장된다.
- `staff_calls` 테이블이 자동 생성되고 인덱스/제약조건이 적용된다.
- 동일 테이블 PENDING 호출 1분 내 중복 검사 쿼리가 동작한다.
