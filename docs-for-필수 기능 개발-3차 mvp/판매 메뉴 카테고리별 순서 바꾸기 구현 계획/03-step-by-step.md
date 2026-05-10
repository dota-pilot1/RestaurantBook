# 03. 단계별 파일별 체크리스트

## Step 1. 기존 정렬 흐름 확인

파일:

- `restaurant-book-server/src/main/java/com/cj/restaurantbook/sale_menu/infrastructure/SaleMenuRepository.java`
- `restaurant-book-front/src/entities/sale-menu/api/saleMenuApi.ts`
- `restaurant-book-front/src/features/sale-menu-category-management/SaleMenuCategoryTable.tsx`
- `restaurant-book-front/src/features/sale-menu-management/SaleMenuManagement.tsx`

확인:

- [ ] 카테고리 자체 순서는 `/sale-menu-categories`에서 조절한다.
- [ ] 판매 메뉴 목록이 `카테고리 displayOrder → 메뉴 displayOrder → id` 기준으로 조회된다.
- [ ] 프론트 `saleMenuApi.update`가 `displayOrder`를 보낼 수 있다.

## Step 2. 카테고리 탭 추가

파일:

- `restaurant-book-front/src/features/sale-menu-management/SaleMenuCategoryTabs.tsx`
- `restaurant-book-front/src/features/sale-menu-management/SaleMenuManagement.tsx`
- `restaurant-book-front/src/features/sale-menu-management/SaleMenuTable.tsx`

작업:

1. `SaleMenuCategoryTabs.tsx` 생성.
2. `전체 (n)`, `식사 (n)` 형태로 카운트를 표시한다.
3. 카테고리 탭 선택을 기존 `categoryId` 필터와 연결한다.
4. 탭은 카드/테이블 토글이 있는 목록 툴바 왼쪽에 배치한다.

검증:

- [ ] 카테고리 탭이 목록 툴바 왼쪽에 표시된다.
- [ ] 카테고리 탭 클릭 시 해당 카테고리 메뉴만 표시된다.
- [ ] `전체` 탭 클릭 시 전체 메뉴가 표시된다.

## Step 3. 카테고리 내부 메뉴 DnD 추가

파일:

- `restaurant-book-front/src/features/sale-menu-management/SaleMenuManagement.tsx`
- `restaurant-book-front/src/features/sale-menu-management/SaleMenuTable.tsx`

작업:

1. 특정 카테고리 선택 상태에서만 reorder를 활성화한다.
2. 검색어/상태/노출 추가 필터가 있으면 reorder를 비활성화한다.
3. 테이블 행에 `GripVertical` 드래그 핸들을 표시한다.
4. `dnd-kit`으로 행 순서를 변경한다.
5. 변경된 순서대로 메뉴 `displayOrder`를 `0..n`으로 저장한다.
6. 성공 시 `sale-menus`, `customer-sale-products` query를 invalidate한다.

검증:

- [ ] `전체` 탭에서는 드래그 핸들이 보이지 않는다.
- [ ] 특정 카테고리 탭에서는 드래그 핸들이 보인다.
- [ ] 드래그 후 순서가 저장된다.
- [ ] 새로고침 후 순서가 유지된다.
- [ ] 검색/상태/노출 필터가 추가되면 드래그 핸들이 숨겨진다.

## Step 4. 판매 메뉴 수정폼에서 정렬 순서 제거

파일:

- `restaurant-book-front/src/features/sale-menu-management/SaleMenuFormDialog.tsx`

작업:

1. 화면에서 `정렬 순서` `Field` 제거.
2. schema/defaultValues/body의 `displayOrder`는 유지한다.
3. 수정 시 기존 메뉴 순서가 보존되는지 확인한다.
4. 신규 생성 시 `displayOrder: 0` 기본값을 유지한다.

검증:

- [ ] 수정폼에 `정렬 순서` 입력이 보이지 않는다.
- [ ] 기존 메뉴를 수정해도 `displayOrder`가 임의로 바뀌지 않는다.
- [ ] 신규 메뉴 추가가 정상 동작한다.

## Step 5. 판매 메뉴 수정 다이얼로그 우상단 닫기 버튼 추가

파일:

- `restaurant-book-front/src/features/sale-menu-management/SaleMenuFormDialog.tsx`

작업:

1. `X` 아이콘 import.
2. 우상단에 icon button 추가.
3. 버튼 `aria-label`은 `닫기`.
4. 기존 하단 `취소` 버튼은 유지.

검증:

- [ ] 우상단 닫기 버튼 클릭 시 다이얼로그가 닫힌다.
- [ ] overlay 클릭 닫기 동작이 유지된다.

## Step 6. 회귀 확인

확인:

- [ ] 검색 필터가 기존처럼 동작한다.
- [ ] 카테고리 select 필터가 기존처럼 동작한다.
- [ ] 상태/노출 필터가 기존처럼 동작한다.
- [ ] 엑셀 다운로드 순서가 화면 순서와 일치한다.
- [ ] 빠른 상태 변경/조리/노출 토글이 기존처럼 동작한다.
- [ ] 카테고리 관리 화면의 카테고리 DnD가 기존처럼 동작한다.

## 명령 검증

```bash
cd /Users/terecal/RestaurantBook/restaurant-book-front
npm run lint
```

```bash
cd /Users/terecal/RestaurantBook/restaurant-book-front
npm run build
```

브라우저:

- `http://localhost:4200/sale-menus`
- `http://localhost:4200/sale-menu-categories`

## 완료 정의

- 판매 메뉴 목록 툴바 왼쪽에 카테고리 탭이 있다.
- 특정 카테고리 안에서 메뉴 순서를 DnD로 조절할 수 있다.
- 카테고리 자체 순서 조절은 `/sale-menu-categories`에만 있다.
- 수정폼의 `정렬 순서` 입력이 제거되어 있다.
- 수정폼 우상단 닫기 버튼이 있다.
- 기존 판매 메뉴 CRUD와 필터가 정상 동작한다.
