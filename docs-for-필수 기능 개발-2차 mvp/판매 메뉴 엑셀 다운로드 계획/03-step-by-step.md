# 03. 단계별 작업 순서 + 검증 체크리스트

작성일: 2026-05-09

## 권장 작업 순서

작은 기능이므로 1개 PR로 처리 가능하다. BeautyBook의 프론트 `xlsx` 구현을 참고해 RestaurantBook도 프론트에서 파일을 생성한다.

### Step 1. 기존 구현 확인

확인 파일:

- `/Users/terecal/beauty-book-hair/beauty-book--front/src/app/sales/page.tsx`
- `/Users/terecal/beauty-book-hair/beauty-book--front/src/features/beauty-service-management/BeautyServiceTable.tsx`
- `/Users/terecal/beauty-book-hair/beauty-book--front/package.json`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/sale_menu/presentation/SaleMenuController.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/sale_menu/application/SaleMenuService.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/sale_menu/infrastructure/SaleMenuRepository.java`
- `restaurant-book-front/src/entities/sale-menu/api/saleMenuApi.ts`
- `restaurant-book-front/src/features/sale-menu-management/SaleMenuManagement.tsx`
- `restaurant-book-front/package.json`

확인 내용:

1. 기존 `GET /api/sale-menus` 필터가 `categoryId/status/visible/keyword`인지 확인한다.
2. 목록 정렬이 repository에서 `카테고리 정렬 → 메뉴 정렬 → id` 순서인지 확인한다.
3. 프론트의 `cleanFilters`가 검색어 trim을 처리하는지 확인한다.
4. BeautyBook은 프론트 `xlsx` 방식으로 엑셀 다운로드를 구현했음을 확인한다.
5. RestaurantBook에는 아직 `xlsx` 의존성과 다운로드 구현이 없음을 확인한다.

완료 기준:

- 엑셀 다운로드는 기존 목록 조회 조건을 그대로 재사용하기로 결정.
- 엑셀 업로드는 범위에서 제외.

### Step 2. 프론트 `xlsx` 의존성 추가

파일:

- `restaurant-book-front/package.json`
- `restaurant-book-front/package-lock.json`

작업:

1. `npm install xlsx` 실행.
2. BeautyBook의 `xlsx: ^0.18.5`와 호환되는 버전인지 확인한다.

검증:

- `cd restaurant-book-front && npm run lint`

### Step 3. 엑셀 row 매핑 정의

파일:

- `restaurant-book-front/src/features/sale-menu-management/SaleMenuManagement.tsx`

작업:

1. 다운로드 대상은 `sortedMenus`로 정한다.
2. 컬럼은 `ID/메뉴명/설명/카테고리/가격/판매 상태/매장 주문/포장 주문/조리 필요/고객 노출/정렬 순서/이미지 URL/생성일/수정일`로 정한다.
3. 상태 라벨은 `ACTIVE=판매중`, `SOLD_OUT=품절`, `HIDDEN=숨김`으로 변환한다.
4. boolean 값은 운영자가 읽기 쉬운 한국어 라벨로 변환한다.

검증:

- 화면 목록과 엑셀 row 수가 일치한다.
- 필터 적용 후 `sortedMenus`만 포함된다.

### Step 4. 다운로드 핸들러 구현

파일:

- `restaurant-book-front/src/features/sale-menu-management/SaleMenuManagement.tsx`

작업:

1. `Download` 아이콘 import.
2. `isDownloadingExcel` state 추가.
3. `handleDownloadExcel` async 함수 추가.
4. `await import("xlsx")`로 동적 import.
5. `utils.json_to_sheet`, `utils.book_new`, `utils.book_append_sheet`, `writeFile` 사용.
6. 컬럼 너비 `ws["!cols"]` 지정.
7. 파일명 `판매메뉴_YYYYMMDD_HHmm.xlsx` 생성.
8. 실패 시 토스트 처리.

검증:

- 빈 목록에서 버튼이 disabled인지 확인.
- 다운로드 중 중복 클릭이 막히는지 확인.

### Step 5. 다운로드 버튼 추가

파일:

- `restaurant-book-front/src/features/sale-menu-management/SaleMenuManagement.tsx`

작업:

1. 상단 버튼 영역에 `엑셀 다운로드` 버튼 추가.
2. 위치는 `카테고리 관리` 왼쪽.
3. `isLoading`, `isDownloadingExcel`, `sortedMenus.length === 0`이면 disabled.
4. 버튼 스타일은 기존 `카테고리 관리` 버튼과 맞춘다.

검증:

- 필터 없이 다운로드.
- 카테고리/상태/노출/검색어 필터 적용 후 다운로드.
- 다운로드 중 버튼 disabled.
- 실패 시 토스트 표시.

### Step 6. 통합 검증

프론트:

- `cd restaurant-book-front && npm run lint`
- 필요 시 `cd restaurant-book-front && npm run build`

브라우저:

- `/sale-menus`에서 전체 다운로드.
- 각 필터 조합별 다운로드.
- 생성 파일을 Excel/Numbers/LibreOffice 중 하나로 열어 확인.
- 이미지 URL 컬럼이 파일 삽입 없이 텍스트로 들어가는지 확인.

### Step 7. 세트 메뉴 동일 패턴 적용

파일:

- `restaurant-book-front/src/features/sale-menu-set-management/SaleMenuSetManagement.tsx`

작업:

1. `Download` 아이콘 import.
2. `isDownloadingExcel` state 추가.
3. `sortedSets` 기준으로 엑셀 row를 만든다.
4. 컬럼은 `ID/세트명/설명/구성/가격/판매 상태/매장 주문/포장 주문/고객 노출/정렬 순서/이미지 URL/생성일/수정일`로 정한다.
5. 구성은 `메뉴명 x수량` 문자열로 합친다.
6. 파일명은 `세트메뉴_YYYYMMDD_HHmm.xlsx`로 만든다.

검증:

- `/sale-menu-sets`에서 전체 다운로드.
- 상태/노출/검색어 필터 적용 후 다운로드.
- 생성 파일에 구성 컬럼이 정상 표시되는지 확인.
- 이미지 URL 컬럼이 파일 삽입 없이 텍스트로 들어가는지 확인.

## 회귀 테스트 체크리스트

- 기존 판매 메뉴 목록 조회 정상.
- 메뉴 추가/수정/삭제 정상.
- 빠른 상태 변경 정상.
- 조리/노출 토글 정상.
- 선택 메뉴 일괄 변경/삭제 정상.
- 카테고리 관리 이동 정상.
- 고객 키오스크 메뉴 노출 영향 없음.
- 백엔드 API 변경 없음.
- 세트 메뉴 목록/상태 변경/노출 토글/수정/삭제 정상.

## 완료 기준

- 관리자/매니저가 판매 메뉴 목록을 `.xlsx`로 다운로드할 수 있다.
- 다운로드 파일은 현재 화면 필터를 반영한다.
- 엑셀 파일에는 운영자가 검토할 수 있는 핵심 필드가 한국어 라벨로 포함된다.
- 엑셀 업로드 기능은 노출되지 않는다.
- 백엔드 엑셀 API 없이 프론트 구현만으로 완료된다.
- 기존 판매 메뉴 CRUD와 고객 주문 흐름에 회귀가 없다.

## 후속 개선

- 매출 통계 엑셀 다운로드와 프론트 공통 Excel helper 추출.
- 대용량/감사 로그 필요 시 백엔드 Excel API로 전환.
- 주문 내역/환불 내역 다운로드 추가.
- 컬럼 선택 옵션.
- 다운로드 이력 저장.
- 대용량 데이터 비동기 다운로드.
- 운영자 요구가 확인된 뒤 검증 미리보기 기반 엑셀 업로드 별도 설계.
