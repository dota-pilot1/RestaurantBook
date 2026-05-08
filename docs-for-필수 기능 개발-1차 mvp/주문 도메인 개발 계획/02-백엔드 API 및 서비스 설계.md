# 백엔드 주문 API 및 서비스 설계

## 고객 주문 생성 API

신규 엔드포인트:

```txt
POST /api/customer/orders
```

권한:

```txt
permitAll
```

고객 키오스크는 비로그인 접근이 가능해야 하므로 고객 주문 생성도 비로그인 허용으로 시작한다.

관리자 주문 조회 API는 별도로 만들고 인증을 요구한다.

## 요청

```json
{
  "orderType": "DINE_IN",
  "items": [
    {
      "type": "SALE_MENU_SET",
      "id": 1,
      "quantity": 1
    },
    {
      "type": "SALE_MENU",
      "id": 3,
      "quantity": 2
    }
  ]
}
```

주의:

- `name`, `price`, `lineTotal`, `components`는 받지 않는다.
- 프론트 장바구니 스냅샷은 표시용이다.
- 주문 저장용 스냅샷은 서버가 DB에서 재조회한다.

## 응답

```json
{
  "id": 10,
  "orderNo": "A001",
  "orderType": "DINE_IN",
  "status": "RECEIVED",
  "totalAmount": 46700,
  "items": [
    {
      "id": 21,
      "type": "SALE_MENU_SET",
      "saleMenuId": null,
      "saleMenuSetId": 1,
      "name": "대표 한상 세트",
      "unitPrice": 15900,
      "quantity": 2,
      "lineTotal": 31800,
      "components": [
        {
          "name": "육회 비빔밥",
          "quantity": 1
        }
      ]
    }
  ],
  "createdAt": "2026-05-07T09:00:00Z"
}
```

MVP 응답은 고객 성공 안내와 디버깅에 필요한 정도면 충분하다.

## 신규 파일

Controller:

```txt
restaurant-book-server/src/main/java/com/cj/restaurantbook/order/presentation/OrderController.java
```

Service:

```txt
restaurant-book-server/src/main/java/com/cj/restaurantbook/order/application/OrderService.java
```

DTO:

```txt
restaurant-book-server/src/main/java/com/cj/restaurantbook/order/presentation/dto/CreateOrderRequest.java
restaurant-book-server/src/main/java/com/cj/restaurantbook/order/presentation/dto/CreateOrderItemRequest.java
restaurant-book-server/src/main/java/com/cj/restaurantbook/order/presentation/dto/OrderResponse.java
restaurant-book-server/src/main/java/com/cj/restaurantbook/order/presentation/dto/OrderItemResponse.java
restaurant-book-server/src/main/java/com/cj/restaurantbook/order/presentation/dto/OrderItemComponentResponse.java
```

## DTO 설계

### CreateOrderRequest

```java
public record CreateOrderRequest(
        @NotNull OrderType orderType,
        @NotEmpty List<CreateOrderItemRequest> items
) {
}
```

### CreateOrderItemRequest

```java
public record CreateOrderItemRequest(
        @NotNull OrderItemType type,
        @NotNull Long id,
        @Min(1) int quantity
) {
}
```

## Service 흐름

`OrderService.createCustomerOrder(req)`:

1. 요청 item 목록을 `type + id` 기준으로 정규화한다.
2. 각 item의 상품을 DB에서 조회한다.
3. 주문 유형별 주문 가능 여부를 검증한다.
4. 단품이면 `OrderItem.fromSaleMenu`로 스냅샷을 만든다.
5. 세트면 `OrderItem.fromSaleMenuSet`으로 스냅샷과 구성 스냅샷을 만든다.
6. `Order.create`로 주문을 만든다.
7. 서버에서 `totalAmount`를 계산한다.
8. `OrderRepository.save(order)`로 저장한다.
9. `OrderResponse.from(order)`를 반환한다.

## 상품 조회

단품:

```txt
SaleMenuRepository.findById(id)
```

세트:

```txt
SaleMenuSetRepository.findById(id)
```

세트 구성은 `SaleMenuSet.items`에서 가져온다.

주의:

- lazy loading 문제가 생기면 repository에 `@EntityGraph` 또는 fetch join 메서드를 추가한다.
- MVP에서는 기존 조회 방식으로 테스트 후 필요할 때 보완한다.

## 주문 번호

MVP 주문 번호 형식:

```txt
yyyyMMdd-HHmmss-{orderId}
```

다만 `orderId`는 저장 후에 알 수 있으므로 구현이 번거롭다.

MVP 권장:

```txt
yyyyMMddHHmmss + random 4 digits
예: 20260507173122-4821
```

운영형 번호는 후속으로 아래처럼 바꿀 수 있다.

```txt
A001, A002 같은 일자별/매장별 호출 번호
```

## 에러 코드

수정:

```txt
restaurant-book-server/src/main/java/com/cj/restaurantbook/common/exception/ErrorCode.java
```

추가 후보:

```txt
ORDER_EMPTY_ITEMS
ORDER_ITEM_NOT_FOUND
ORDER_ITEM_NOT_ORDERABLE
ORDER_ITEM_INVALID_QUANTITY
ORDER_INVALID_TYPE
```

이미 `ORDER_ITEM_NOT_ORDERABLE`가 있으면 재사용한다.

## 보안 설정

수정:

```txt
restaurant-book-server/src/main/java/com/cj/restaurantbook/config/SecurityConfig.java
```

추가:

```java
.requestMatchers(HttpMethod.POST, "/api/customer/orders").permitAll()
```

후속 관리자 API:

```txt
GET /api/orders
GET /api/orders/{id}
PATCH /api/orders/{id}/status
```

이 API들은 `ADMIN`, `MANAGER`, `STAFF`, `KITCHEN` 역할 기반으로 별도 설계한다.

## 테스트

신규 테스트 후보:

```txt
restaurant-book-server/src/test/java/com/cj/restaurantbook/order/application/OrderServiceTest.java
```

우선순위:

1. 단품 주문 저장
2. 세트 주문 저장 및 구성 스냅샷 저장
3. 단품+세트 혼합 주문 총액 계산
4. 품절 상품 주문 거절
5. 포장 불가 상품을 `TAKEOUT`으로 주문하면 거절

MVP에서 테스트 환경 구성이 무거우면 최소한 `./gradlew test` 전체 통과를 보장한다.
