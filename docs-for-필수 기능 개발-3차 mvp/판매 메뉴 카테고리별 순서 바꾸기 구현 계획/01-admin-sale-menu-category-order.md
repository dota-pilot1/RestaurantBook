# 01. 관리자 판매 메뉴 화면 카테고리별 메뉴 순서 조절

## 현재 상태

프론트:

- `restaurant-book-front/package.json`에 `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`, `@dnd-kit/utilities`가 이미 있다.
- `restaurant-book-front/src/features/sale-menu-category-management/SaleMenuCategoryTable.tsx`에서 카테고리 자체 DnD 정렬을 이미 구현하고 있다.
- `restaurant-book-front/src/features/sale-menu-management/SaleMenuManagement.tsx`는 카테고리 목록과 판매 메뉴 목록을 조회한다.
- `restaurant-book-front/src/features/sale-menu-management/SaleMenuFormDialog.tsx`에는 기존에 `정렬 순서` 숫자 입력이 있었다.

백엔드:

- `SaleMenuCategory.displayOrder`가 존재한다.
- `SaleMenuRepository`는 판매 메뉴 조회 시 `COALESCE(c.displayOrder, 999999), m.displayOrder, m.id` 순서로 정렬한다.
- `PATCH /api/sale-menus/{id}`는 메뉴 `displayOrder`를 저장할 수 있다.

## 화면 배치

`/sale-menus` 화면은 다음 구조로 둔다.

1. 상단 액션 버튼 영역
   - 엑셀 다운로드
   - 카테고리 관리
   - 메뉴 추가
2. 검색/필터 영역
3. 목록 툴바
   - 왼쪽: 카테고리 탭 `전체 (n)`, `식사 (n)`, `국/찌개 (n)` ...
   - 오른쪽: `테이블/카드` 토글
4. 판매 메뉴 목록

카테고리 자체 순서 조절은 이 화면에 중복 구현하지 않는다. 필요한 경우 `카테고리 관리`로 이동한다.

## 카테고리별 메뉴 순서 조절 정책

- `전체` 탭에서는 순서 조절을 허용하지 않는다.
- 특정 카테고리 탭을 선택하면 해당 카테고리 메뉴만 표시한다.
- 특정 카테고리 선택 상태에서 검색어/상태/노출 필터가 추가로 걸려 있으면 순서 조절을 비활성화한다.
- 순서 저장은 해당 카테고리 안의 메뉴 `displayOrder`만 `0..n`으로 재배정한다.

이 정책을 두는 이유는 부분 필터가 걸린 상태에서 일부 메뉴만 재정렬하면 숨겨진 메뉴와 `displayOrder`가 충돌하거나 운영자가 의도하지 않은 순서가 저장될 수 있기 때문이다.

## 컴포넌트 설계

새 컴포넌트:

- `restaurant-book-front/src/features/sale-menu-management/SaleMenuCategoryTabs.tsx`

수정 컴포넌트:

- `restaurant-book-front/src/features/sale-menu-management/SaleMenuManagement.tsx`
- `restaurant-book-front/src/features/sale-menu-management/SaleMenuTable.tsx`
- `restaurant-book-front/src/features/sale-menu-management/SaleMenuFormDialog.tsx`

책임:

- `SaleMenuCategoryTabs`: 카테고리별 카운트 탭 렌더링
- `SaleMenuManagement`: 탭 선택을 기존 `categoryId` 필터와 연결, 메뉴 순서 저장 mutation 관리
- `SaleMenuTable`: 목록 툴바에 탭을 표시하고, reorder 가능 상태에서 테이블 행 DnD 제공
- `SaleMenuFormDialog`: `정렬 순서` 입력 제거, 우상단 닫기 버튼 추가

## API 설계

백엔드 신규 API는 MVP에서 만들지 않는다.

기존 API 사용:

- `GET /api/sale-menus`
- `GET /api/sale-menu-categories`
- `PATCH /api/sale-menus/{id}`

DnD 저장 방식:

- 드롭 직후 변경된 카테고리 내부 메뉴를 순서대로 순회한다.
- 각 메뉴에 대해 기존 필드는 유지하고 `displayOrder`만 새 index로 바꿔 `PATCH`한다.

후속:

- 카테고리당 메뉴 수가 많아지면 bulk reorder API를 검토한다.

## 판매 메뉴 수정폼 변경

파일:

- `restaurant-book-front/src/features/sale-menu-management/SaleMenuFormDialog.tsx`

변경:

- `정렬 순서` 필드를 화면에서 제거한다.
- schema/defaultValues/body에는 `displayOrder`를 유지한다.
- 수정 시 기존 `menu.displayOrder`를 그대로 보낸다.
- 신규 생성 시 `displayOrder: 0` 기본값을 유지한다.
- 다이얼로그 우상단에 `X` 닫기 버튼을 추가한다.

## 검증

- `/sale-menus` 목록 툴바 왼쪽에 카테고리 탭이 보인다.
- `식사 (n)` 같은 카테고리 탭을 누르면 해당 카테고리 메뉴만 표시된다.
- 특정 카테고리 선택 상태에서 메뉴 행을 드래그해 순서를 저장할 수 있다.
- 새로고침 후에도 메뉴 순서가 유지된다.
- `전체` 탭에서는 메뉴 DnD가 노출되지 않는다.
- 검색/상태/노출 추가 필터가 걸린 상태에서는 메뉴 DnD가 노출되지 않는다.
- 메뉴 수정 다이얼로그에 `정렬 순서` 입력이 보이지 않는다.
- 다이얼로그 우상단 닫기 버튼으로 닫힌다.
- `npm run lint`와 `npm run build`가 통과한다.
