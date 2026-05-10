# 01. 데이터/API 확인

## 확인 목적

고객 키오스크 `전체 보기`는 카테고리 섹션 단위로 렌더링해야 한다. 이를 위해 고객 메뉴 API 응답이 카테고리 정보를 충분히 제공하는지 확인한다.

## 확인 파일

백엔드:

- `restaurant-book-server/src/main/java/com/cj/restaurantbook/customer_menu/application/CustomerSaleProductService.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/customer_menu/presentation/CustomerSaleProductController.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/customer_menu/presentation/dto/CustomerSaleProductResponse.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/customer_menu/presentation/dto/CustomerSaleProductComponentResponse.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/sale_menu/infrastructure/SaleMenuRepository.java`

프론트:

- `restaurant-book-front/src/entities/customer-sale-product/api/customerSaleProductApi.ts`
- `restaurant-book-front/src/entities/customer-sale-product/model/types.ts`
- `restaurant-book-front/src/app/customer/page.tsx`

## 확인 항목

- [ ] 고객 메뉴 API가 카테고리 순서를 반영해서 내려주는가.
- [ ] 응답에 카테고리 id가 있는가.
- [ ] 응답에 카테고리 name이 있는가.
- [ ] 응답에 카테고리 visible 필터가 적용되는가.
- [ ] 메뉴 visible/status 필터가 기존처럼 적용되는가.
- [ ] 매장/포장 주문 유형 필터가 기존처럼 적용되는가.
- [ ] 세트 메뉴가 별도 상품 타입으로 섞이는 경우 카테고리 섹션 기준을 어떻게 잡는가.

## API 구현 옵션

### Option A. 현재 배열 응답 유지 + 프론트 그룹핑

고객 메뉴 API가 전체 메뉴를 카테고리 순서대로 내려준다.

프론트는 응답 배열을 순회하면서 카테고리별로 그룹핑한다.

장점:

- 백엔드 변경이 작다.
- 기존 응답 구조를 최대한 유지한다.

단점:

- 응답에 카테고리 id/name이 반드시 있어야 한다.
- 세트 메뉴 등 카테고리 없는 상품의 처리 규칙이 필요하다.

### Option B. 백엔드 섹션 응답 추가

고객 메뉴 API가 섹션 구조로 내려준다.

```json
[
  {
    "categoryId": 1,
    "categoryName": "식사",
    "items": []
  }
]
```

장점:

- 프론트 렌더링이 명확하다.
- API 계약 자체가 고객 화면 구조와 일치한다.

단점:

- 백엔드 변경 범위가 커진다.
- 기존 고객 메뉴 API 사용자와의 호환성을 고려해야 한다.

## MVP 결정

먼저 Option A를 검토한다.

현재 응답만으로 카테고리 섹션 그룹핑이 어렵다면, 그때 Option B 또는 별도 `GET /api/customer-sale-products/sections` 형태를 검토한다.

## 검증 기준

- 전체 메뉴 응답의 정렬이 `카테고리 displayOrder → 메뉴 displayOrder → id`와 일치한다.
- 카테고리 없는 메뉴가 있다면 `기타` 섹션 또는 제외 중 하나로 정책을 정한다.
- 숨김 카테고리의 메뉴가 고객 화면에 노출되지 않는다.
