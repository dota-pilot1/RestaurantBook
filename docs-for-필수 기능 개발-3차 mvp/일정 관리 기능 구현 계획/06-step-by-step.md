# 06. 단계별 구현 순서

## 전체 흐름

1. 백엔드 도메인/DB
2. 백엔드 API/권한
3. 프론트 API/hook
4. 프론트 캘린더 화면
5. 메뉴/대시보드 연결
6. 통합 검증

1개 PR로 처리해도 되지만, 안전하게 나누면 백엔드 PR과 프론트 PR 2개가 적당하다.

## Step 1. 백엔드 도메인/DB

파일:

- `restaurant-book-server/src/main/java/com/cj/restaurantbook/admin_calendar/domain/AdminCalendarEntryType.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/admin_calendar/domain/AdminCalendarEntry.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/admin_calendar/infrastructure/AdminCalendarEntryRepository.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/admin_calendar/application/AdminCalendarService.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/common/exception/ErrorCode.java`

작업:

1. `admin_calendar` 패키지 생성
2. enum 4종 작성
3. Entity 작성: table `admin_calendar_entries`
   - `createdBy`/`createdByName`/`updatedBy` 포함
   - FK 제약: `created_by` ON DELETE RESTRICT, `updated_by` ON DELETE SET NULL
4. 인덱스 2개 추가
5. Repository `findInRange` 작성
6. Service 작성 (시그니처에 `createdByName`, `updatedBy` 포함)
7. `ErrorCode` 4개 추가

검증:

- [ ] `./gradlew bootRun` 또는 IDE 부팅 성공
- [ ] DB에 `admin_calendar_entries` 생성
- [ ] `\d admin_calendar_entries`로 인덱스 2개 + FK 제약 확인 (ddl-auto는 인덱스 재현 보장이 약함)
- [ ] `ErrorCode` enum 문법 오류 없음

## Step 2. 백엔드 API/권한

파일:

- `restaurant-book-server/src/main/java/com/cj/restaurantbook/admin_calendar/presentation/AdminCalendarController.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/admin_calendar/presentation/dto/AdminCalendarEntryResponse.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/admin_calendar/presentation/dto/CreateAdminCalendarEntryRequest.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/admin_calendar/presentation/dto/UpdateAdminCalendarEntryRequest.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/config/SecurityConfig.java` (선택)

작업:

1. DTO 3개 작성 (Response에 `createdByName`, `updatedBy` 포함)
2. Controller 작성
3. class level `@PreAuthorize("hasRole('ADMIN')")`
4. `@AuthenticationPrincipal UserPrincipal`로 `createdBy`/`createdByName`/`updatedBy` 저장
5. Swagger tag/operation 추가
6. **`AdminCalendarServiceTest` 4건 필수 작성** ([02-backend-api-security.md](./02-backend-api-security.md) 테스트 섹션)

검증:

- [ ] ADMIN 토큰 `GET /api/admin/calendar/entries?from=2026-05-01&to=2026-05-31` → 200
- [ ] ADMIN 토큰 `POST` → 201, 응답에 `createdByName` 포함 확인
- [ ] ADMIN 토큰 `PUT` → 200, 응답에 `updatedBy` 갱신 확인
- [ ] ADMIN 토큰 `DELETE` → 204
- [ ] CUSTOMER 토큰 → 403
- [ ] 비로그인 → 401
- [ ] `from > to` → 400 `ADMIN_CALENDAR_002`
- [ ] 96일 범위 → 400 `ADMIN_CALENDAR_003`
- [ ] title blank → 400 `ADMIN_CALENDAR_004`
- [ ] 없는 id 수정/삭제 → 404 `ADMIN_CALENDAR_001`
- [ ] `./gradlew test`에서 `AdminCalendarServiceTest` 4건 통과

## Step 3. 프론트 API/hook

파일:

- `restaurant-book-front/src/entities/admin-calendar/model/types.ts`
- `restaurant-book-front/src/entities/admin-calendar/api/adminCalendarApi.ts`
- `restaurant-book-front/src/entities/admin-calendar/model/useAdminCalendar.ts`

작업:

1. 타입 정의
2. API client 작성
3. query/mutation hook 작성
4. mutation 성공 시 `["admin-calendar"]` invalidate

검증:

- [ ] `npm run lint`
- [ ] import alias 오류 없음
- [ ] 임시 페이지 또는 React Query Devtools 기준 API 호출 성공

## Step 4. 프론트 캘린더 화면

파일:

- `restaurant-book-front/src/app/admin/calendar/page.tsx`
- `restaurant-book-front/src/app/admin/calendar/_lib/calendar.ts`
- `restaurant-book-front/src/app/admin/calendar/_components/typeMeta.ts`
- `restaurant-book-front/src/app/admin/calendar/_components/CalendarGrid.tsx`
- `restaurant-book-front/src/app/admin/calendar/_components/EntryTable.tsx`
- `restaurant-book-front/src/app/admin/calendar/_components/AdminCalendarEntryFormDialog.tsx`

작업:

1. BeautyBook 파일 구조 복사
2. package/import 경로를 RestaurantBook에 맞춤
3. `FormDialog` 의존 제거, 직접 modal overlay로 변경
4. page title/description을 식당 운영 문구로 변경
5. 타입 라벨/placeholder 식당 운영형으로 변경
6. 등록/수정/삭제 toast 연결
7. 빈 상태/로딩/에러 표시

검증:

- [ ] `/admin/calendar` 관리자 진입 가능
- [ ] 비관리자 직접 접근 시 `/unauthorized`
- [ ] 월 이동, 오늘 이동 동작
- [ ] 날짜 클릭 필터 동작
- [ ] 새 일정 등록 후 화면 갱신
- [ ] 수정 후 화면 갱신
- [ ] 삭제 후 화면 갱신
- [ ] 모바일 폭에서 캘린더와 표가 겹치지 않음
- [ ] `npm run lint`

## Step 5. 메뉴/대시보드 연결

> 실제 코드 diff와 음수 id 충돌 확인까지 포함된 상세 문서: [07-menu-addition-detailed.md](./07-menu-addition-detailed.md)

파일:

- `restaurant-book-server/src/main/java/com/cj/restaurantbook/config/NavigationMenuSeeder.java`
- `restaurant-book-front/src/widgets/header/ui/Header.tsx`
- `restaurant-book-front/src/features/admin-dashboard/AdminDashboard.tsx`

작업:

1. `NavigationMenuSeeder`에 `ADMIN_CALENDAR` 추가
2. `Header.tsx` fallback 메뉴에 `ADMIN_CALENDAR` 추가 (음수 id 충돌 확인)
3. `Header.tsx` lucide import에 `CalendarCheck2` 추가
4. `adminMenuMeta.ADMIN_CALENDAR` 추가
5. `AdminDashboard`의 `operationLinks`에 일정 관리 추가
6. **`xl:grid-cols-4` 유지** ([05-menu-dashboard-integration.md](./05-menu-dashboard-integration.md) 결정 참조)

검증:

- [ ] 헤더 `관리 > 운영 관리 > 일정 관리` 노출
- [ ] 메뉴 클릭 시 `/admin/calendar`
- [ ] 관리자 대시보드 바로가기 노출
- [ ] NavigationMenu API가 실패해도 fallback 메뉴에 일정 관리가 있음
- [ ] 두 번째 백엔드 부팅에서 메뉴 중복 없음

## Step 6. 통합 검증

로컬 시나리오:

1. 관리자 테스트 계정으로 로그인
2. `관리 > 운영 관리 > 일정 관리` 이동
3. 오늘 날짜에 `휴무` 일정 생성
4. 같은 날짜에 `이벤트` 일정 추가 생성
5. 캘린더 셀에 점 2개 표시 확인
6. 날짜 클릭 후 우측 목록이 2건으로 필터되는지 확인
7. 이벤트 일정을 수정 (응답의 `updatedBy`가 갱신되는지 DevTools에서 확인)
8. 휴무 일정을 삭제
9. 새로고침 후 데이터 유지 확인
10. CUSTOMER 계정으로 직접 `/admin/calendar` 접근 시 차단 확인
11. **KST 자정 경계 확인**: 23:55 등록한 일정이 다음 날로 넘어가지 않는지 확인 ([01-backend-db-domain.md](./01-backend-db-domain.md) 시간대 합의)
12. **인덱스 확인**: `psql`에서 `\d admin_calendar_entries` 실행, 인덱스 2개와 FK 제약 확인

명령:

```bash
cd /Users/terecal/RestaurantBook/restaurant-book-server
./gradlew test
```

```bash
cd /Users/terecal/RestaurantBook/restaurant-book-front
npm run lint
```

브라우저 확인:

- `http://localhost:4200/admin/calendar`
- `http://localhost:4200/dashboard`

## 위험 및 완화

| 위험 | 영향 | 완화 |
|------|------|------|
| BeautyBook의 `FormDialog`를 그대로 import | 빌드 실패 | RestaurantBook modal overlay 패턴으로 재작성 |
| 테이블명을 BeautyBook처럼 singular로 생성 | 컨벤션 불일치 | `admin_calendar_entries`로 명확히 작성 |
| `ROLE_MANAGER` 접근 기대와 메뉴 노출 불일치 | 운영자 혼란 | MVP는 `ROLE_ADMIN`으로 명시, 매니저 공개는 별도 작업 |
| 날짜 timezone 흔들림 | 오늘/선택일 오차 | `todayKST()`와 `YYYY-MM-DD` 문자열 유지, [01-backend-db-domain.md](./01-backend-db-domain.md) 시간대 합의 명문화 |
| Header fallback id 충돌 | fallback 메뉴 트리 오류 | 추가 전 기존 음수 id 확인 |
| 일정 타입 과확장 | 구현 범위 증가 | MVP는 4종 유지, 식당 문구만 변경 |
| 사용자 삭제 시 일정 cascade | 데이터 유실 | `created_by ON DELETE RESTRICT`, `updated_by ON DELETE SET NULL` |
| ddl-auto의 인덱스 재현 미보장 | 운영 성능 저하 | 부팅 후 `\d`로 인덱스 직접 확인 |
| 작성자 표기 추후 요구 | DTO breaking change | `createdByName`을 응답에 미리 포함, 화면만 후속 노출 |

## 후속 작업 트래킹

MVP 머지 직후 별도 이슈로 트래킹할 항목:

- [ ] **`ROLE_MANAGER` 노출**: Header `buildTree`의 단일 `requiredRole` 구조 확장 또는 권한 기반 필터로 전환. 식당 운영자(매니저)가 일정 관리의 1차 사용자일 가능성이 큼.
- [ ] **다국어 메뉴 라벨**: `ko/en/ja/zh` 4개 언어에 `nav.operationsCalendar` 키 추가, `labelKey` 지정.
- [ ] **작성자 컬럼 표시**: `EntryTable`에 `createdByName` 컬럼 노출 (응답 필드는 이미 포함).
- [ ] **`HOLIDAY` ↔ 영업시간 연동**: `business_hours` 도메인이 추가되면 `HOLIDAY` 일정을 영업시간 override로 자동 변환하는 어댑터.
- [ ] **`RESERVATION` 분리**: 단체예약을 `restaurant_table` 시간 점유와 연결할 시점에 `RESERVATION` 타입 분리, `time_text` → `LocalTime startAt/endAt` 마이그레이션.
- [ ] **`NOTICE` 직원 알림**: `staff_call` 또는 별도 notification 도메인과 연결.

## 완료 정의

- 관리자 운영 관리 메뉴에서 일정 관리 진입 가능
- 월간 캘린더와 우측 일정 목록이 API 데이터로 렌더링
- 등록/수정/삭제 CRUD 완료
- 권한 차단 완료
- 백엔드 부팅 정상
- 프론트 lint 통과
- 문서와 실제 구현의 경로/API/테이블명이 일치
