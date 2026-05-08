# 백엔드 API 설계

## 관리자 세트 메뉴 API

Base URL:

```txt
/api/sale-menu-sets
```

엔드포인트:

```txt
GET    /api/sale-menu-sets
POST   /api/sale-menu-sets
GET    /api/sale-menu-sets/{id}
PATCH  /api/sale-menu-sets/{id}
DELETE /api/sale-menu-sets/{id}
```

권한:

```txt
ROLE_ADMIN
ROLE_MANAGER
```

목록 조회 쿼리:

```txt
status
visible
keyword
```

## 세트 메뉴 응답

```json
{
  "id": 1,
  "name": "대표 한상 세트",
  "description": "메인 메뉴와 오늘의 반찬 4종",
  "price": 12900,
  "imageUrl": "https://...",
  "status": "ACTIVE",
  "visible": true,
  "availableDineIn": true,
  "availableTakeout": true,
  "displayOrder": 1,
  "items": [
    {
      "id": 10,
      "saleMenu": {
        "id": 3,
        "name": "육회 비빔밥",
        "price": 12000
      },
      "quantity": 1,
      "displayOrder": 1
    }
  ],
  "createdAt": "2026-05-07T00:00:00Z",
  "updatedAt": "2026-05-07T00:00:00Z"
}
```

## 생성/수정 요청

```json
{
  "name": "대표 한상 세트",
  "description": "메인 메뉴와 오늘의 반찬 4종",
  "price": 12900,
  "imageUrl": null,
  "status": "ACTIVE",
  "visible": true,
  "availableDineIn": true,
  "availableTakeout": true,
  "displayOrder": 1,
  "items": [
    {
      "saleMenuId": 3,
      "quantity": 1,
      "displayOrder": 1
    },
    {
      "saleMenuId": 5,
      "quantity": 4,
      "displayOrder": 2
    }
  ]
}
```

## 고객 키오스크 상품 조회 API

단품과 세트를 고객 화면에서 함께 보여줘야 하므로 고객용 union API를 둔다.

Base URL:

```txt
/api/customer/sale-products
```

엔드포인트:

```txt
GET /api/customer/sale-products
```

쿼리:

```txt
orderType=DINE_IN|TAKEOUT
section=ALL|SET|MENU
categoryId
```

응답:

```json
[
  {
    "type": "SALE_MENU_SET",
    "id": 1,
    "name": "대표 한상 세트",
    "description": "메인 메뉴와 오늘의 반찬 4종",
    "price": 12900,
    "imageUrl": "https://...",
    "status": "ACTIVE",
    "displayOrder": 1,
    "components": [
      {
        "name": "육회 비빔밥",
        "quantity": 1
      }
    ]
  },
  {
    "type": "SALE_MENU",
    "id": 3,
    "category": {
      "id": 2,
      "name": "식사"
    },
    "name": "육회 비빔밥",
    "description": "신선한 육회와 나물을 올린 대표 비빔밥",
    "price": 12000,
    "imageUrl": "https://...",
    "status": "ACTIVE",
    "displayOrder": 2,
    "components": []
  }
]
```

고객 화면 노출 조건:

```txt
visible = true
status in (ACTIVE, SOLD_OUT)
orderType에 따라 available_dine_in 또는 available_takeout = true
```

주문 가능 조건:

```txt
visible = true
status = ACTIVE
orderType에 따라 available_dine_in 또는 available_takeout = true
```

## 주문 생성 API 연동

주문 요청은 단품과 세트를 구분한다.

```json
{
  "orderType": "DINE_IN",
  "items": [
    {
      "type": "SALE_MENU",
      "id": 3,
      "quantity": 1
    },
    {
      "type": "SALE_MENU_SET",
      "id": 1,
      "quantity": 2
    }
  ]
}
```

서버는 `type`에 따라 `sale_menus` 또는 `sale_menu_sets`를 조회한다. 가격과 구성은 서버에서 다시 읽어 스냅샷으로 저장한다.

## 에러 코드

권장 에러 코드:

```txt
SALE_MENU_SET_NOT_FOUND
SALE_MENU_SET_INVALID_PRICE
SALE_MENU_SET_EMPTY_ITEMS
SALE_MENU_SET_ITEM_INVALID
SALE_MENU_SET_NOT_ORDERABLE
ORDER_ITEM_NOT_ORDERABLE
```

