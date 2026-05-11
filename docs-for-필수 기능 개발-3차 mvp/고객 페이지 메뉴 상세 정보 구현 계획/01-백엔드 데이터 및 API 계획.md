# 01. 백엔드 데이터 및 API 계획

## 현재 구조

고객 메뉴 목록은 다음 흐름으로 내려간다.

- `CustomerSaleProductController`
  - `GET /api/customer/sale-products`
- `CustomerSaleProductService`
  - 단품: `SaleMenuRepository.findCustomerSaleMenus(...)`
  - 세트: `SaleMenuSetRepository.findCustomerSaleMenuSets(...)`
- `CustomerSaleProductResponse`
  - 현재 필드: `type`, `id`, `category`, `name`, `description`, `price`, `imageUrl`, `status`, `displayOrder`, `components`

현재 `SaleMenu`, `SaleMenuSet` 도메인에는 고객에게 보여줄 추가 상세/영양 필드가 없다.

## 추가할 데이터 필드

단품 메뉴와 세트 메뉴에 같은 형태의 고객 표시용 메타 정보를 둔다.

권장 필드:

```java
@Column(length = 1000)
private String detailDescription;

@Column(length = 1000)
private String ingredients;

@Column(length = 500)
private String allergens;

private Integer caloriesKcal;
private Integer carbohydrateG;
private Integer proteinG;
private Integer fatG;
private Integer sodiumMg;
```

설계 의도:

- `description`: 카드에 보이는 짧은 설명 유지
- `detailDescription`: 다이얼로그 왼쪽 상세 설명
- `ingredients`: 원재료/구성 설명
- `allergens`: 알레르기 유발 성분
- 영양 수치는 nullable로 두어 미입력 상태를 표현

## 수정 대상 파일

### `restaurant-book-server/src/main/java/com/cj/restaurantbook/sale_menu/domain/SaleMenu.java`

- 위 상세/영양 필드 추가
- `create(...)`, `update(...)` 파라미터와 대입 로직 확장
- getter는 Lombok `@Getter`로 자동 제공

### `restaurant-book-server/src/main/java/com/cj/restaurantbook/sale_menu_set/domain/SaleMenuSet.java`

- 단품과 같은 상세/영양 필드 추가
- `create(...)`, `update(...)` 파라미터와 대입 로직 확장
- 세트 영양 정보는 자동 합산하지 않고 관리자가 직접 입력

### 요청 DTO

수정 대상:

- `sale_menu/presentation/dto/CreateSaleMenuRequest.java`
- `sale_menu/presentation/dto/UpdateSaleMenuRequest.java`
- `sale_menu_set/presentation/dto/CreateSaleMenuSetRequest.java`
- `sale_menu_set/presentation/dto/UpdateSaleMenuSetRequest.java`

추가 필드:

```java
String detailDescription,
String ingredients,
String allergens,
Integer caloriesKcal,
Integer carbohydrateG,
Integer proteinG,
Integer fatG,
Integer sodiumMg
```

검증 권장:

- 텍스트 필드: `@Size(max = ...)`
- 영양 수치: `@Min(0)`

### 응답 DTO

수정 대상:

- `sale_menu/presentation/dto/SaleMenuResponse.java`
- `sale_menu_set/presentation/dto/SaleMenuSetResponse.java`
- `customer_menu/presentation/dto/CustomerSaleProductResponse.java`

고객 응답에는 다음처럼 구조화된 중첩 DTO를 권장한다.

```java
CustomerSaleProductDetailResponse detail,
CustomerSaleProductNutritionResponse nutrition
```

예시:

```java
public record CustomerSaleProductDetailResponse(
        String description,
        String ingredients,
        String allergens
) {}

public record CustomerSaleProductNutritionResponse(
        Integer caloriesKcal,
        Integer carbohydrateG,
        Integer proteinG,
        Integer fatG,
        Integer sodiumMg
) {}
```

`description` 이름 충돌을 피하려면 고객 상세 DTO 내부에서는 `detailDescription` 대신 `description`으로 내려도 된다. 프론트 타입에서는 `product.detail.description`으로 접근 가능하다.

### 서비스

수정 대상:

- `sale_menu/application/SaleMenuService.java`
- `sale_menu_set/application/SaleMenuSetService.java`

작업:

- create/update 호출부에 신규 요청 필드 전달
- 목록/상세 응답 매핑에 신규 필드 포함

### 스키마 마이그레이션

현재 프로젝트는 도메인별 `SchemaMigrator` 패턴이 일부 존재한다. 운영 방식에 맞춰 아래 둘 중 하나로 진행한다.

1. JPA ddl-auto 또는 개발 DB 자동 반영을 쓰는 경우
   - 엔티티 필드 추가 후 개발 DB에서 컬럼 생성 확인

2. 명시적 마이그레이션을 쓰는 경우
   - `sale_menus`, `sale_menu_sets`에 신규 컬럼 추가

권장 컬럼:

```sql
alter table sale_menus add column detail_description varchar(1000);
alter table sale_menus add column ingredients varchar(1000);
alter table sale_menus add column allergens varchar(500);
alter table sale_menus add column calories_kcal integer;
alter table sale_menus add column carbohydrate_g integer;
alter table sale_menus add column protein_g integer;
alter table sale_menus add column fat_g integer;
alter table sale_menus add column sodium_mg integer;

alter table sale_menu_sets add column detail_description varchar(1000);
alter table sale_menu_sets add column ingredients varchar(1000);
alter table sale_menu_sets add column allergens varchar(500);
alter table sale_menu_sets add column calories_kcal integer;
alter table sale_menu_sets add column carbohydrate_g integer;
alter table sale_menu_sets add column protein_g integer;
alter table sale_menu_sets add column fat_g integer;
alter table sale_menu_sets add column sodium_mg integer;
```

## 백엔드 완료 기준

- 관리자 메뉴 생성/수정 API가 상세/영양 필드를 저장한다.
- 관리자 메뉴 조회 API가 상세/영양 필드를 반환한다.
- 고객 메뉴 목록 API가 상세/영양 필드를 반환한다.
- 기존 메뉴 데이터는 신규 필드가 null이어도 정상 조회된다.

