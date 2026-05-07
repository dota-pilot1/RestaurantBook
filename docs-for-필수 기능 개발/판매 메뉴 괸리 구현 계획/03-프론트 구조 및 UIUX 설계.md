# 프론트 구조 및 UI/UX 설계

## 프론트 디렉터리

```txt
restaurant-book-front/src/entities/sale-menu
├── api
│   └── saleMenuApi.ts
└── model
    └── types.ts

restaurant-book-front/src/entities/sale-menu-category
├── api
│   └── saleMenuCategoryApi.ts
└── model
    └── types.ts

restaurant-book-front/src/features/sale-menu-management
├── SaleMenuManagement.tsx
├── SaleMenuTable.tsx
├── SaleMenuFormDialog.tsx
├── SaleMenuFilters.tsx
└── SaleMenuImageField.tsx

restaurant-book-front/src/features/sale-menu-category-management
├── SaleMenuCategoryManagement.tsx
├── SaleMenuCategoryTable.tsx
└── SaleMenuCategoryFormDialog.tsx

restaurant-book-front/src/features/sale-menu-availability
└── SaleMenuAvailabilityBoard.tsx
```

## `/sale-menus` 화면 목표

판매 메뉴의 메인 관리 화면이다.

권장 구성:

```txt
상단:
- 페이지 제목
- 메뉴 추가 버튼
- 카테고리 관리 이동 버튼

필터:
- 검색어
- 카테고리
- 상태
- 노출 여부
- 매장/포장 가능 여부

본문:
- 판매 메뉴 테이블
- 이미지 썸네일
- 메뉴명/설명
- 카테고리
- 가격
- 상태
- 매장/포장 배지
- 노출 토글
- 수정/삭제 액션
```

## 목록 UI

테이블 우선이 좋다.

판매 메뉴 관리는 반복 작업이 많고 가격/상태/노출을 비교해야 하므로 카드보다 테이블이 효율적이다.

컬럼:

```txt
이미지
메뉴명
카테고리
가격
상태
주문 유형
노출
정렬
관리
```

상태 배지:

```txt
ACTIVE: 판매중
SOLD_OUT: 품절
HIDDEN: 숨김
```

주문 유형 배지:

```txt
매장
포장
```

## 등록/수정 폼

모달 또는 우측 Drawer 중 하나를 선택한다.

MVP에서는 모달이 빠르다.

필드:

```txt
카테고리
메뉴명
가격
설명
대표 이미지
상태
노출 여부
매장 주문 가능
포장 주문 가능
정렬 순서
```

가격 입력:

- 숫자만 입력
- 0 이상
- 화면 표시 시 `9,000원`

이미지:

- 기존 `uploadImage` 재사용
- 업로드 폴더는 `sale-menu`
- 이미지 삭제 버튼 제공

## `/sale-menu-categories` 화면

카테고리만 관리하는 화면이다.

구성:

```txt
카테고리 추가 버튼
카테고리 목록 테이블
이름
설명
노출 여부
정렬 순서
수정/삭제
```

카테고리 삭제 정책:

- 연결된 판매 메뉴가 있으면 삭제 실패
- UI에서는 실패 메시지를 명확히 표시

## `/sale-menu-availability` 화면

운영 중 빠르게 품절/숨김/노출 상태를 바꾸는 화면이다.

구성:

```txt
카테고리 탭
판매 메뉴 리스트
판매중/품절/숨김 상태 버튼
매장 가능 토글
포장 가능 토글
```

이 화면은 CRUD보다는 빠른 운영 액션에 집중한다.

## 빈 상태

판매 메뉴가 없을 때:

```txt
등록된 판매 메뉴가 없습니다.
```

액션:

```txt
판매 메뉴 추가
```

카테고리가 없을 때:

```txt
먼저 카테고리를 등록하세요.
```

액션:

```txt
카테고리 추가
```

## 디자인 방향

- 운영 도구이므로 정보 밀도를 높인다.
- 마케팅식 큰 히어로는 사용하지 않는다.
- 테이블, 필터, 배지, 토글 중심으로 구성한다.
- 카드 중첩은 피한다.
- 버튼에는 가능한 lucide 아이콘을 쓴다.
