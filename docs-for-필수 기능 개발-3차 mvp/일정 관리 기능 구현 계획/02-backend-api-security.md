# 02. 백엔드 API + 권한

## Controller

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/admin_calendar/presentation/AdminCalendarController.java`

경로는 BeautyBook과 동일하게 둔다.

```java
@Tag(name = "운영 일정 관리")
@RestController
@RequestMapping("/api/admin/calendar")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCalendarController {
    ...
}
```

API:

| Method | URL | 설명 |
|--------|-----|------|
| `GET` | `/api/admin/calendar/entries?from=YYYY-MM-DD&to=YYYY-MM-DD` | 월 범위 일정 조회 |
| `POST` | `/api/admin/calendar/entries` | 일정 생성 |
| `PUT` | `/api/admin/calendar/entries/{id}` | 일정 수정 (전체 교체 시맨틱) |
| `DELETE` | `/api/admin/calendar/entries/{id}` | 일정 삭제 (hard delete) |

- `POST`는 `@AuthenticationPrincipal UserPrincipal principal`에서 `principal.getId()`와 `principal.getUsername()`(또는 표시 이름)을 꺼내 각각 `createdBy`, `createdByName`으로 저장한다.
- `PUT`은 `principal.getId()`를 `updatedBy`로 저장한다. **부분 수정이 아니라 전체 교체 시맨틱**이므로 프론트는 모든 필드를 다시 보내야 한다 (현재 모달이 그렇게 동작).
- `DELETE`는 hard delete. soft delete는 [01-backend-db-domain.md](./01-backend-db-domain.md)에서 의도적으로 채택하지 않았다.

## DTO

디렉터리:

`restaurant-book-server/src/main/java/com/cj/restaurantbook/admin_calendar/presentation/dto`

파일:
- `AdminCalendarEntryResponse.java`
- `CreateAdminCalendarEntryRequest.java`
- `UpdateAdminCalendarEntryRequest.java`

### Request

```java
public record CreateAdminCalendarEntryRequest(
        @NotNull LocalDate scheduleDate,
        @NotNull AdminCalendarEntryType type,
        @NotBlank @Size(max = 120) String title,
        @Size(max = 40) String timeText,
        @Size(max = 4000) String content
) {}
```

`UpdateAdminCalendarEntryRequest`는 생성 요청과 동일하다.

### Response

```java
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
    public static AdminCalendarEntryResponse from(AdminCalendarEntry e) { ... }
}
```

`createdByName`을 응답에 포함해 두면 프론트는 join 없이 작성자 라벨을 표시할 수 있다. MVP 화면에서 표기를 안 하더라도 응답 필드는 미리 포함한다 (후속 화면 변경만으로 노출 가능).

## SecurityConfig 변경 여부

`SecurityConfig.java`는 현재 `anyRequest().authenticated()`이고, Controller에 `@PreAuthorize("hasRole('ADMIN')")`를 붙이면 기능상 충분하다.

명시성을 높이고 싶으면 아래 matcher를 추가할 수 있다.

```java
.requestMatchers("/api/admin/calendar/**").hasRole("ADMIN")
```

다만 이미 메서드 보안이 켜져 있으므로 필수는 아니다.

## 권한 정책

MVP:
- 조회/생성/수정/삭제 모두 `ROLE_ADMIN`
- 프론트 페이지도 `RequireRole roles={["ROLE_ADMIN"]}`로 감싼다.
- 헤더 메뉴도 `requiredRole=ROLE_ADMIN`으로 시드한다.

후속:
- `ROLE_MANAGER`에게도 열려면 Controller와 페이지 가드를 `hasAnyRole('ADMIN','MANAGER')`, `roles={["ROLE_ADMIN","ROLE_MANAGER"]}`로 바꾼다.
- 헤더 메뉴는 현재 단일 `requiredRole` 구조라 별도 수정이 필요하다.

## API 검증 시나리오

관리자 토큰:

1. `GET /api/admin/calendar/entries?from=2026-05-01&to=2026-05-31` → 200, 빈 배열 또는 목록
2. `POST /api/admin/calendar/entries` → 201, 생성된 일정 반환
3. `PUT /api/admin/calendar/entries/{id}` → 200, 수정된 일정 반환
4. `DELETE /api/admin/calendar/entries/{id}` → 204

비관리자 토큰:

1. `GET /api/admin/calendar/entries?...` → 403
2. `POST /api/admin/calendar/entries` → 403

비로그인:

1. `GET /api/admin/calendar/entries?...` → 401

잘못된 요청:

1. `from > to` → 400 `ADMIN_CALENDAR_002`
2. 95일 초과 조회 → 400 `ADMIN_CALENDAR_003`
3. title blank → 400
4. 없는 id 수정/삭제 → 404 `ADMIN_CALENDAR_001`

## 테스트

### 필수 (`AdminCalendarServiceTest`)

다음 4건은 머지 전 통과해야 한다. Service 단위라 작성 비용이 작고, 회귀에 가장 잘 걸린다.

- [ ] `to.isBefore(from)` → `ADMIN_CALENDAR_INVALID_RANGE`
- [ ] 96일 범위 → `ADMIN_CALENDAR_RANGE_TOO_WIDE`
- [ ] title blank/whitespace → `ADMIN_CALENDAR_TITLE_REQUIRED`
- [ ] 없는 id update/delete → `ADMIN_CALENDAR_ENTRY_NOT_FOUND`

### 권장 (`AdminCalendarControllerTest`)

가능하면 함께 작성한다. RestaurantBook 기존 테스트 인프라가 충분하지 않을 경우에만 수동 curl로 대체.

- ADMIN 200/201/204
- CUSTOMER 403
- 미인증 401
