# 판매 메뉴 엑셀 다운로드 계획

작성일: 2026-05-09

## 결론

판매 메뉴 관리는 **엑셀 다운로드만 MVP 범위에 포함**하고, 엑셀 업로드는 제외한다.

이유:

- 현재 판매 메뉴에는 이미지, 카테고리, 판매 상태, 주문 유형, 조리 필요 여부, 노출 여부처럼 엑셀에서 오입력되기 쉬운 필드가 많다.
- 업로드를 제대로 만들려면 템플릿, 행별 검증, 미리보기, 기존 메뉴 매칭, 이미지 처리, 롤백 정책까지 필요해 기능 범위가 커진다.
- 운영자가 당장 필요한 것은 백업/검토/공유용 목록이므로 다운로드가 먼저다.

## 기존 구현 참고

RestaurantBook 코드베이스에는 **실제 엑셀 다운로드 구현은 없다**.

참고 가능한 기존 구조:

- 판매 메뉴 목록 API: `restaurant-book-server/src/main/java/com/cj/restaurantbook/sale_menu/presentation/SaleMenuController.java`
- 판매 메뉴 조회 서비스: `restaurant-book-server/src/main/java/com/cj/restaurantbook/sale_menu/application/SaleMenuService.java`
- 판매 메뉴 필터 쿼리: `restaurant-book-server/src/main/java/com/cj/restaurantbook/sale_menu/infrastructure/SaleMenuRepository.java`
- 프론트 판매 메뉴 API: `restaurant-book-front/src/entities/sale-menu/api/saleMenuApi.ts`
- 프론트 판매 메뉴 화면: `restaurant-book-front/src/features/sale-menu-management/SaleMenuManagement.tsx`
- 매출 통계 문서의 후속 개선 항목에만 `CSV/엑셀 다운로드` 언급이 있음: `docs-for-필수 기능 개발-2차 mvp/매출 통계 페이지 구현 계획 for 매니저 페이지/04-step-by-step.md`

BeautyBook에는 참고할 실제 구현이 있다.

- `/Users/terecal/beauty-book-hair/beauty-book--front/src/app/sales/page.tsx`
  - `await import("xlsx")`로 동적 import
  - 현재 화면에서 필터링된 rows를 `utils.json_to_sheet`로 변환
  - `writeFile`로 바로 다운로드
- `/Users/terecal/beauty-book-hair/beauty-book--front/src/features/beauty-service-management/BeautyServiceTable.tsx`
  - `import * as XLSX from "xlsx"`
  - 시술 목록 다운로드/업로드 구현
  - 업로드는 RestaurantBook 판매 메뉴 MVP에서는 참고만 하고 적용하지 않음
- `/Users/terecal/beauty-book-hair/beauty-book--front/package.json`
  - `xlsx: ^0.18.5` 의존성 사용

RestaurantBook 프론트 `package.json`에는 아직 `xlsx` 의존성이 없다.

## 권장 구현 방향

**MVP는 BeautyBook처럼 프론트에서 `.xlsx` 파일을 생성**한다.

이유:

- 판매 메뉴 목록은 이미 `/sale-menus` 화면에서 필터 결과 전체를 `GET /api/sale-menus`로 받고 있다.
- 다운로드할 데이터가 화면 데이터와 같으므로 별도 백엔드 API 없이 구현 가능하다.
- RestaurantBook 2차 MVP 범위에서는 서버 Excel writer와 테스트까지 추가하는 것보다 작업량이 작다.
- BeautyBook에서 같은 프론트 `xlsx` 방식이 이미 운영 패턴으로 존재한다.

백엔드 생성 방식은 후속으로 남긴다. 데이터가 커지거나 다운로드 이력/권한 감사/대용량 스트리밍이 필요해지면 `GET /api/sale-menus/excel`로 전환한다.

## MVP 범위

포함:

- `/sale-menus` 관리자 화면에 `엑셀 다운로드` 버튼 추가
- 현재 적용된 필터(`categoryId`, `status`, `visible`, `keyword`) 기준으로 다운로드
- 기존 목록 정렬과 동일한 순서 유지
- `.xlsx` 파일 생성
- 한국어 헤더/라벨 적용
- 다운로드 파일명에 날짜/시간 포함
- 프론트 `xlsx` 의존성 추가

추가 적용:

- `/sale-menu-sets` 세트 메뉴 관리도 같은 프론트 `xlsx` 방식으로 다운로드 버튼을 제공한다.
- 세트 메뉴는 판매 메뉴와 같은 운영 관리 성격이며, 이미 같은 보기 토글 패턴을 공유하므로 별도 백엔드 API 없이 동일하게 현재 필터/정렬 결과를 다운로드한다.

제외:

- 엑셀 업로드
- 이미지 파일을 엑셀 내부에 삽입
- 백엔드 엑셀 다운로드 API
- 대용량 비동기 다운로드
- 다운로드 이력 관리
- 컬럼 선택/사용자별 템플릿 저장

## 문서 구성

- `01-backend-excel-api.md`: 후속 백엔드 API 전환안
- `02-frontend-download-ui.md`: MVP 프론트 `xlsx` 다운로드 계획
- `03-step-by-step.md`: 구현 단계와 검증 체크리스트
