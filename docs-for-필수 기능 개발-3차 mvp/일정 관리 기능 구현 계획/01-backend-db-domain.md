# 01. 백엔드 DB + 도메인

## 신규 패키지

```
restaurant-book-server/src/main/java/com/cj/restaurantbook/admin_calendar/
├── domain/
│   ├── AdminCalendarEntry.java
│   └── AdminCalendarEntryType.java
├── infrastructure/
│   └── AdminCalendarEntryRepository.java
├── application/
│   └── AdminCalendarService.java
└── presentation/
    ├── AdminCalendarController.java
    └── dto/
```

BeautyBook의 `admin_calendar` 패키지를 거의 그대로 복사하되 package명과 테이블명만 RestaurantBook에 맞춘다.

## 테이블

RestaurantBook 기존 테이블은 대부분 plural이다. 따라서 `admin_calendar_entries`를 권장한다.

```sql
CREATE TABLE admin_calendar_entries (
    id              BIGSERIAL PRIMARY KEY,
    schedule_date   DATE NOT NULL,
    type            VARCHAR(20) NOT NULL,
    title           VARCHAR(120) NOT NULL,
    time_text       VARCHAR(40),
    content         TEXT,
    created_by      BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_by_name VARCHAR(200),
    updated_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_calendar_entries_date
    ON admin_calendar_entries (schedule_date);

CREATE INDEX idx_admin_calendar_entries_date_type
    ON admin_calendar_entries (schedule_date, type);
```

### 컬럼 결정 사항

- **`created_by` ON DELETE RESTRICT**: 작성자 사용자 삭제 시 일정도 같이 사라지지 않도록 보존 우선. 사용자 삭제 정책이 soft delete로 통일되면 자연히 무관해진다.
- **`created_by_name`**: `boards.author_name` 패턴과 일관. 작성자 user join 없이 운영 화면 표기를 가능하게 하기 위한 denormalized 필드. 등록 시점에 `users.username` 또는 표시용 이름을 복사 저장한다. 일정 조회 응답에 작성자 표기를 노출할지는 [04-frontend-calendar-ui.md](./04-frontend-calendar-ui.md)에서 결정.
- **`updated_by`**: 여러 ADMIN이 같은 일정을 수정하는 시나리오에서 audit. `ON DELETE SET NULL`로 두어 사용자 삭제와 일정 보존을 분리한다. 화면 표시는 후속.
- **soft delete 미사용 (hard delete)**: `boards`는 `deleted_at` 기반 soft delete를 쓰지만, 운영 일정은 회고/감사 가치가 낮고 캘린더 점/목록의 정확성을 우선한다. 후속에 audit 요구가 생기면 `deleted_at` 컬럼을 추가하고 Repository 쿼리에 `deleted_at IS NULL` 조건을 추가한다.

### 시간대 합의

- `schedule_date`는 **Asia/Seoul 캘린더 날짜**로 해석한다.
- 프론트는 `todayKST()`와 `YYYY-MM-DD` 문자열만 사용한다.
- 백엔드는 `LocalDate`로 받고 timezone 변환 없이 그대로 저장·비교한다.
- `created_at`/`updated_at`는 `TIMESTAMPTZ`로 UTC 보관. 화면에서 표시할 때만 KST 포맷팅한다.

이 합의가 없으면 KST 자정 직전에 등록한 일정이 "어제로 보이는" 흔한 버그가 발생한다.

### 스키마 적용 방식

로컬은 `spring.jpa.hibernate.ddl-auto=update`라 엔티티 생성 후 부팅하면 테이블이 자동 생성된다. 다만 `ddl-auto=update`는 **인덱스 추가/변경에 대한 재현 보장이 약하다**. 따라서:

- 로컬: 부팅 후 `\d admin_calendar_entries`로 인덱스 2개가 실제로 잡혔는지 확인.
- 운영 배포 전: 위 SQL을 기준으로 직접 실행하거나 비교한다. 이는 [06-step-by-step.md](./06-step-by-step.md)의 Step 6 통합 검증에 포함된다.

## Entity

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/admin_calendar/domain/AdminCalendarEntry.java`

작성 기준:
- `@Table(name = "admin_calendar_entries")`
- `@Index` 2개 포함
- `@Enumerated(EnumType.STRING)`
- `createdBy`/`updatedBy`는 `User` 연관관계가 아니라 `Long`으로 저장 (월별 조회 시 join 회피)
- `createdByName`은 등록 시점 user 이름을 복사한 denormalized 필드
- `@CreationTimestamp`, `@UpdateTimestamp` 사용
- `create`, `update`, `blankToNull` 메서드는 BeautyBook과 동일하게 둔다. `update`는 `updatedBy`도 함께 받는다.

핵심 필드:

```java
private LocalDate scheduleDate;
private AdminCalendarEntryType type;
private String title;
private String timeText;
private String content;
private Long createdBy;
private String createdByName;
private Long updatedBy;
private Instant createdAt;
private Instant updatedAt;
```

`createdBy`를 `@ManyToOne User`로 잡지 않는 이유:
- 월별 조회에서 불필요한 join을 피한다.
- `boards.author_id` + `boards.author_name` 패턴과 동일하게 denormalized 이름을 함께 저장한다.
- 사용자 이름이 변경되어도 일정의 등록 당시 이름은 보존된다 (audit 일관성).

## Enum

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/admin_calendar/domain/AdminCalendarEntryType.java`

```java
public enum AdminCalendarEntryType {
    NOTICE,
    HOLIDAY,
    EVENT,
    MEMO
}
```

식당 특화 라벨은 프론트의 `typeMeta.ts`에서 처리한다.

## Repository

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/admin_calendar/infrastructure/AdminCalendarEntryRepository.java`

```java
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
```

단일 날짜 조회는 프론트에서 월 범위 데이터를 날짜 필터링하면 되므로 MVP에서는 없어도 된다.

## Service

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/admin_calendar/application/AdminCalendarService.java`

BeautyBook과 동일한 메서드 구성. 단 `createdBy`와 `updatedBy`에 작성자 이름까지 함께 받는다.

- `listInRange(LocalDate from, LocalDate to)`
- `create(LocalDate scheduleDate, AdminCalendarEntryType type, String title, String timeText, String content, Long createdBy, String createdByName)`
- `update(Long id, LocalDate scheduleDate, AdminCalendarEntryType type, String title, String timeText, String content, Long updatedBy)`
- `delete(Long id)`

검증:
- `from/to` null 금지
- `to.isBefore(from)` 금지
- 조회 범위는 95일 이하
- title blank 금지
- id가 없으면 not found

추가할 `ErrorCode`:

```java
ADMIN_CALENDAR_ENTRY_NOT_FOUND(HttpStatus.NOT_FOUND, "ADMIN_CALENDAR_001", "일정을 찾을 수 없습니다."),
ADMIN_CALENDAR_INVALID_RANGE(HttpStatus.BAD_REQUEST, "ADMIN_CALENDAR_002", "조회 기간이 올바르지 않습니다."),
ADMIN_CALENDAR_RANGE_TOO_WIDE(HttpStatus.BAD_REQUEST, "ADMIN_CALENDAR_003", "조회 기간이 너무 깁니다."),
ADMIN_CALENDAR_TITLE_REQUIRED(HttpStatus.BAD_REQUEST, "ADMIN_CALENDAR_004", "일정 제목을 입력해주세요."),
```

## 인접 도메인 영향 평가

현재 RestaurantBook 백엔드 도메인 구성을 검토한 결과 **추가 도메인 신설은 불필요**하고 `admin_calendar` 단일 패키지로 충분하다. 다만 인접 도메인의 부재/존재는 일정 기능의 향후 확장 방향을 제약한다.

| 인접 도메인 | 현재 상태 | 일정 기능 영향 |
|------|------|------|
| `business_hours` / `operating_hours` | **없음** | `HOLIDAY` 일정이 키오스크 주문/영업시간을 자동 변경하지 않는다. MVP 비목표와 일치. 후속에 영업시간 도메인이 추가되면 `HOLIDAY` → 영업시간 override 어댑터가 필요해질 수 있음. |
| `reservation` (시간 점유) | **없음**. `restaurant_table`은 테이블 자체만 있고 시간 슬롯 점유 개념 없음 | `EVENT(단체예약)`을 자유 텍스트 메모로 두는 게 정합. 후속에 예약 도메인이 생기면 `RESERVATION` enum 분리 시점. |
| `staff_call` | 직원 호출 (즉시성) | 일정의 `NOTICE`(사전 등록)와 의미가 다르므로 충돌 없음. 후속에 "NOTICE를 직원에게 푸시"가 추가되면 staff_call 또는 별도 notification 도메인과 연결점 발생. |
| `manager` | ROLE_MANAGER 전용 패키지 존재 | MVP는 ADMIN 전용. 후속 매니저 노출 시 `manager` 패키지에 일정 dashboard 카드 endpoint를 추가하는 옵션이 있다. |
| `board` | "운영자 작성 콘텐츠 + admin CRUD" 가장 유사 패턴 | 패턴 정렬 완료: `created_by_name` denormalized 필드 추가, soft delete는 명시적으로 미사용. |
| `navigation_menu` | DB 시드 + Header fallback 트리오 | 계획 [05-menu-dashboard-integration.md](./05-menu-dashboard-integration.md)에서 모두 다룸. |
| `permission` / `permission_category` | 기능 단위 권한 도메인 존재 | MVP는 ROLE_ADMIN 단순화. 후속에 매니저 노출이 권한 기반으로 가면 이 도메인을 활용한다. |

## 파일별 체크리스트

- [ ] `domain/AdminCalendarEntryType.java` 생성
- [ ] `domain/AdminCalendarEntry.java` 생성 (`createdByName`, `updatedBy` 포함)
- [ ] `infrastructure/AdminCalendarEntryRepository.java` 생성
- [ ] `application/AdminCalendarService.java` 생성 (`createdByName`, `updatedBy` 시그니처)
- [ ] `common/exception/ErrorCode.java`에 일정 관리 에러 추가
- [ ] 백엔드 부팅 후 `admin_calendar_entries` 테이블 생성 확인
- [ ] `\d admin_calendar_entries`로 인덱스 2개 생성 확인 (ddl-auto는 인덱스 재현 보장이 약함)
- [ ] `created_by` ON DELETE RESTRICT, `updated_by` ON DELETE SET NULL 제약 확인
