# 프론트 구조 및 UIUX 설계

## 프론트 원칙

세트 메뉴는 단품 판매 메뉴와 별도 엔티티로 둔다.

단품:

```txt
restaurant-book-front/src/entities/sale-menu/model/types.ts
restaurant-book-front/src/entities/sale-menu/api/saleMenuApi.ts
```

세트:

```txt
restaurant-book-front/src/entities/sale-menu-set/model/types.ts
restaurant-book-front/src/entities/sale-menu-set/api/saleMenuSetApi.ts
```

고객 키오스크 union 상품:

```txt
restaurant-book-front/src/entities/customer-sale-product/model/types.ts
restaurant-book-front/src/entities/customer-sale-product/api/customerSaleProductApi.ts
```

## 세트 메뉴 타입

```ts
export type SaleMenuSetItem = {
  id: number;
  saleMenu: {
    id: number;
    name: string;
    price: number;
  };
  quantity: number;
  displayOrder: number;
};

export type SaleMenuSet = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  status: "ACTIVE" | "SOLD_OUT" | "HIDDEN";
  visible: boolean;
  availableDineIn: boolean;
  availableTakeout: boolean;
  displayOrder: number;
  items: SaleMenuSetItem[];
  createdAt: string;
  updatedAt: string;
};
```

## 관리자 세트 메뉴 화면

신규 페이지:

```txt
restaurant-book-front/src/app/sale-menu-sets/page.tsx
```

신규 feature:

```txt
restaurant-book-front/src/features/sale-menu-set-management/SaleMenuSetManagement.tsx
restaurant-book-front/src/features/sale-menu-set-management/SaleMenuSetTable.tsx
restaurant-book-front/src/features/sale-menu-set-management/SaleMenuSetFormDialog.tsx
restaurant-book-front/src/features/sale-menu-set-management/SaleMenuSetItemEditor.tsx
restaurant-book-front/src/features/sale-menu-set-management/SaleMenuSetFilters.tsx
restaurant-book-front/src/features/sale-menu-set-management/SaleMenuSetImageField.tsx
```

폼 UX:

- 세트명
- 설명
- 가격
- 이미지
- 판매 상태
- 노출 여부
- 매장/포장 가능 여부
- 정렬 순서
- 구성 품목

구성 품목 편집:

- 기존 단품 `sale_menus` 중 선택
- 수량 입력
- 정렬 순서
- 삭제
- 최소 1개 이상 검증

## 카테고리 정책

`세트`는 카테고리로 강제하지 않는다.

카테고리는 단품 메뉴 분류이고, 세트 탭은 `sale_menu_sets`를 조회하는 별도 섹션이다.

```txt
세트 탭: sale_menu_sets
식사 탭: sale_menus category = 식사
반찬 탭: sale_menus category = 반찬
음료 탭: sale_menus category = 음료
```

## 고객 키오스크 수정

현재 하드코딩 위치:

```txt
restaurant-book-front/src/features/kiosk/KioskHome.tsx
```

수정 방향:

1. `categories`, `menuItems` 하드코딩 제거
2. 상단 탭은 `세트` 고정 탭 + API 카테고리 탭으로 구성
3. `세트` 탭 선택 시 `sale_menu_sets` 또는 `/api/customer/sale-products?section=SET` 조회
4. 일반 카테고리 탭 선택 시 `sale_menus` 또는 `/api/customer/sale-products?section=MENU&categoryId=...` 조회
5. 세트 카드는 구성 요약을 보조 텍스트로 표시
6. 장바구니는 `type + id` 기준으로 담기
7. 결제하기 클릭 시 주문 API 호출

권장 장바구니 타입:

```ts
type CartItem = {
  type: "SALE_MENU" | "SALE_MENU_SET";
  id: number;
  name: string;
  price: number;
  quantity: number;
};
```

## 주문 API 파일

주문 도메인 연동 시 추가한다.

```txt
restaurant-book-front/src/entities/order/model/types.ts
restaurant-book-front/src/entities/order/api/orderApi.ts
```

주문 요청:

```ts
type CreateOrderBody = {
  orderType: "DINE_IN" | "TAKEOUT";
  items: Array<{
    type: "SALE_MENU" | "SALE_MENU_SET";
    id: number;
    quantity: number;
  }>;
};
```

## 내비게이션

관리자 메뉴에는 `판매 메뉴 관리`와 `세트 메뉴 관리`를 분리하는 편이 명확하다.

수정 후보:

```txt
restaurant-book-front/src/widgets/header/ui/Header.tsx
restaurant-book-server/src/main/java/com/cj/restaurantbook/config/NavigationMenuSeeder.java
```

