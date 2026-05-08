# 프론트 데이터 구조 및 API

## 신규 엔티티

고객 화면은 단품과 세트를 같은 카드 목록으로 다룬다. 따라서 고객용 union 타입을 별도로 둔다.

신규 파일:

```txt
restaurant-book-front/src/entities/customer-sale-product/model/types.ts
restaurant-book-front/src/entities/customer-sale-product/api/customerSaleProductApi.ts
```

## 타입

```ts
export type SaleProductType = "SALE_MENU" | "SALE_MENU_SET";

export type CustomerOrderType = "DINE_IN" | "TAKEOUT";

export type SaleProductSection = "ALL" | "SET" | "MENU";

export type CustomerSaleProductComponent = {
  name: string;
  quantity: number;
};

export type CustomerSaleProduct = {
  type: SaleProductType;
  id: number;
  category: {
    id: number;
    name: string;
  } | null;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  status: "ACTIVE" | "SOLD_OUT" | "HIDDEN";
  displayOrder: number;
  components: CustomerSaleProductComponent[];
};
```

## API 함수

```ts
export type CustomerSaleProductFilters = {
  orderType?: CustomerOrderType;
  section?: SaleProductSection;
  categoryId?: number;
};

export const customerSaleProductApi = {
  list: (filters: CustomerSaleProductFilters) =>
    api.get<CustomerSaleProduct[]>("/api/customer/sale-products", { params: filters })
      .then((r) => r.data),
};
```

## 카테고리 API

탭 구성을 위해 기존 API를 사용한다.

```txt
GET /api/sale-menu-categories
```

주의:

- 현재 이 API는 관리자 권한이 필요할 가능성이 있다.
- 고객 화면에서 비로그인 접근이 필요하면 백엔드에서 `GET /api/sale-menu-categories`를 permitAll 하거나 고객용 카테고리 API를 별도로 둔다.
- MVP에서는 기존 API를 재사용하되, 고객 페이지 접근 방식에 맞춰 보안 설정을 확인한다.

## 쿼리 매핑

매장:

```txt
orderType=DINE_IN
```

포장:

```txt
orderType=TAKEOUT
```

세트 탭:

```txt
section=SET
```

일반 카테고리 탭:

```txt
section=MENU&categoryId={id}
```
