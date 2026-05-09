# 일정 관리 기능 구현 계획

작성일: 2026-05-09

참고 프로젝트: `/Users/terecal/beauty-book-hair`

## 핵심 결정

RestaurantBook의 일정 관리는 BeautyBook의 `admin_calendar` 기능을 거의 그대로 가져오되, 의미와 메뉴 위치를 식당 운영에 맞춘다.

- 페이지: `/admin/calendar`
- 메뉴: `관리 > 운영 관리 > 일정 관리`
- API: `/api/admin/calendar/entries`
- 백엔드 패키지: `com.cj.restaurantbook.admin_calendar` (단일 패키지로 충분, 추가 도메인 신설 없음)
- 프론트 entity: `src/entities/admin-calendar`
- 프론트 화면: `src/app/admin/calendar`
- 권한: MVP에서는 `ROLE_ADMIN`
- 타입: `NOTICE`, `HOLIDAY`, `EVENT`, `MEMO`
- 작성자: `boards` 패턴과 일관 — `created_by` + `created_by_name` denormalized + `updated_by`
- 시간대: `schedule_date`는 Asia/Seoul 캘린더 날짜로 해석
- 삭제: hard delete (soft delete는 의도적 미사용)
- FK 정책: `created_by` ON DELETE RESTRICT, `updated_by` ON DELETE SET NULL

## 문서

| 파일 | 내용 |
|------|------|
| [일정 관리 기능.md](./일정%20관리%20기능.md) | 결론, 범위, 문서 구성 |
| [00-overview.md](./00-overview.md) | 전체 UX와 RestaurantBook 적용 방향 |
| [01-backend-db-domain.md](./01-backend-db-domain.md) | DB/Entity/Repository/Service 설계 |
| [02-backend-api-security.md](./02-backend-api-security.md) | API/DTO/권한/예외 설계 |
| [03-frontend-api-hooks.md](./03-frontend-api-hooks.md) | 프론트 API, 타입, Tanstack Query 훅 |
| [04-frontend-calendar-ui.md](./04-frontend-calendar-ui.md) | 캘린더 UI, 목록, CRUD 모달 |
| [05-menu-dashboard-integration.md](./05-menu-dashboard-integration.md) | 운영 관리 메뉴, 헤더, 관리자 대시보드 연결 (개요) |
| [06-step-by-step.md](./06-step-by-step.md) | 실제 구현 순서와 검증 체크리스트 |
| [07-menu-addition-detailed.md](./07-menu-addition-detailed.md) | 메뉴 추가 상세 (실제 코드 diff, 복붙 가능 수준) |

## BeautyBook에서 그대로 참고할 파일

백엔드:

- `/Users/terecal/beauty-book-hair/beauty-book-server/src/main/java/com/cj/beautybook/admin_calendar/domain/AdminCalendarEntry.java`
- `/Users/terecal/beauty-book-hair/beauty-book-server/src/main/java/com/cj/beautybook/admin_calendar/domain/AdminCalendarEntryType.java`
- `/Users/terecal/beauty-book-hair/beauty-book-server/src/main/java/com/cj/beautybook/admin_calendar/infrastructure/AdminCalendarEntryRepository.java`
- `/Users/terecal/beauty-book-hair/beauty-book-server/src/main/java/com/cj/beautybook/admin_calendar/application/AdminCalendarService.java`
- `/Users/terecal/beauty-book-hair/beauty-book-server/src/main/java/com/cj/beautybook/admin_calendar/presentation/AdminCalendarController.java`
- `/Users/terecal/beauty-book-hair/beauty-book-server/src/main/java/com/cj/beautybook/admin_calendar/presentation/dto/*`

프론트:

- `/Users/terecal/beauty-book-hair/beauty-book--front/src/entities/admin-calendar/api/adminCalendarApi.ts`
- `/Users/terecal/beauty-book-hair/beauty-book--front/src/entities/admin-calendar/model/types.ts`
- `/Users/terecal/beauty-book-hair/beauty-book--front/src/entities/admin-calendar/model/useAdminCalendar.ts`
- `/Users/terecal/beauty-book-hair/beauty-book--front/src/app/admin/calendar/page.tsx`
- `/Users/terecal/beauty-book-hair/beauty-book--front/src/app/admin/calendar/_lib/calendar.ts`
- `/Users/terecal/beauty-book-hair/beauty-book--front/src/app/admin/calendar/_components/*`

## 완료 기준

- 관리자 계정으로 `관리 > 운영 관리 > 일정 관리` 진입 가능
- 월간 캘린더와 이 달 일정 목록이 실데이터로 표시됨
- 새 일정 등록 후 캘린더 점과 우측 목록이 즉시 갱신됨
- 목록 행 클릭으로 수정/삭제 가능
- 비관리자 직접 접근 시 `/unauthorized` 또는 403 처리
- `AdminCalendarServiceTest` 4건 (range/title/not-found) 통과
- `npm run lint`, `./gradlew test` 통과
- DB 인덱스 2개 + FK 제약(`ON DELETE RESTRICT`/`SET NULL`) 실제 생성 확인
- KST 자정 경계 회귀 통과
