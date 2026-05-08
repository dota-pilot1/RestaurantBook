# 백엔드 API 설계

## 카테고리 API

Base URL:

```txt
/api/sale-menu-categories
```

엔드포인트:

```txt
GET    /api/sale-menu-categories
POST   /api/sale-menu-categories
PATCH  /api/sale-menu-categories/{id}
DELETE /api/sale-menu-categories/{id}
```

권한:

```txt
ROLE_ADMIN
ROLE_MANAGER
```

카테고리 응답:

```json
{
  "id": 1,
  "name": "식사",
  "description": "식사 메뉴",
  "visible": true,
  "displayOrder": 0,
  "createdAt": "2026-05-07T00:00:00Z",
  "updatedAt": "2026-05-07T00:00:00Z"
}
```

생성/수정 요청:

```json
{
  "name": "식사",
  "description": "식사 메뉴",
  "visible": true,
  "displayOrder": 0
}
```

## 판매 메뉴 API

Base URL:

```txt
/api/sale-menus
```

엔드포인트:

```txt
GET    /api/sale-menus
POST   /api/sale-menus
GET    /api/sale-menus/{id}
PATCH  /api/sale-menus/{id}
DELETE /api/sale-menus/{id}
```

권한:

```txt
ROLE_ADMIN
ROLE_MANAGER
```

목록 조회 쿼리:

```txt
categoryId
status
visible
keyword
```

판매 메뉴 응답:

```json
{
  "id": 1,
  "category": {
    "id": 1,
    "name": "식사"
  },
  "name": "김치볶음밥",
  "description": "매장에서 직접 볶은 김치볶음밥",
  "price": 9000,
  "imageUrl": "https://...",
  "status": "ACTIVE",
  "visible": true,
  "availableDineIn": true,
  "availableTakeout": true,
  "displayOrder": 0,
  "createdAt": "2026-05-07T00:00:00Z",
  "updatedAt": "2026-05-07T00:00:00Z"
}
```

생성 요청:

```json
{
  "categoryId": 1,
  "name": "김치볶음밥",
  "description": "매장에서 직접 볶은 김치볶음밥",
  "price": 9000,
  "imageUrl": "https://...",
  "status": "ACTIVE",
  "visible": true,
  "availableDineIn": true,
  "availableTakeout": true,
  "displayOrder": 0
}
```

수정 요청:

```json
{
  "categoryId": 1,
  "name": "김치볶음밥",
  "description": "매장에서 직접 볶은 김치볶음밥",
  "price": 9000,
  "imageUrl": "https://...",
  "status": "SOLD_OUT",
  "visible": true,
  "availableDineIn": true,
  "availableTakeout": false,
  "displayOrder": 2
}
```

## 빠른 상태 변경 API

목록 UI에서 자주 쓰는 상태 변경은 별도 엔드포인트를 둘 수 있다.

```txt
PATCH /api/sale-menus/{id}/status
PATCH /api/sale-menus/{id}/visibility
PATCH /api/sale-menus/{id}/availability
```

MVP에서는 전체 `PATCH /api/sale-menus/{id}`로 처리해도 된다.

빠른 변경 API는 UI가 복잡해지는 시점에 추가한다.

## 에러 코드

권장 에러 코드:

```txt
SALE_MENU_NOT_FOUND
SALE_MENU_CATEGORY_NOT_FOUND
SALE_MENU_INVALID_PRICE
SALE_MENU_CATEGORY_IN_USE
```

카테고리 삭제 시 연결된 판매 메뉴가 있으면 우선 삭제를 막는다.

```txt
SALE_MENU_CATEGORY_IN_USE
```

## 업로드

이미지 업로드는 기존 공통 업로드 API를 재사용한다.

```txt
/api/upload/presign
folder: sale-menu
```

프론트에서는 기존 `uploadImage(file, "sale-menu")` 형태로 사용한다.
