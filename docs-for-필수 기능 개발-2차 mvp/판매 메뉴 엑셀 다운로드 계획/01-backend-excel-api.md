# 01. 백엔드 엑셀 다운로드 API 전환안

## 위치

이 문서는 MVP 구현안이 아니라 **후속 전환안**이다.

2차 MVP에서는 BeautyBook 참고 구현처럼 프론트에서 `xlsx` 파일을 생성한다. 백엔드 API 방식은 다음 조건 중 하나가 생기면 검토한다.

- 판매 메뉴 수가 많아져 브라우저 생성이 부담된다.
- 다운로드 이력/감사 로그가 필요하다.
- 서버 권한 기준으로 다운로드 대상 컬럼을 통제해야 한다.
- 매출/주문/환불 다운로드와 공통 서버 Excel writer를 만들기로 한다.

## 목표

관리자/매니저가 판매 메뉴 목록을 현재 필터 조건 그대로 서버에서 생성한 `.xlsx` 파일로 다운로드할 수 있게 한다.

## API 계약

신규 엔드포인트:

```http
GET /api/sale-menus/excel
```

Query params:

- `categoryId?: Long`
- `status?: SaleMenuStatus`
- `visible?: Boolean`
- `keyword?: String`

권한:

- 기존 `SaleMenuController`와 동일하게 `ROLE_ADMIN`, `ROLE_MANAGER`

Response:

- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename*=UTF-8''sale-menus-YYYYMMDD-HHmm.xlsx`
- Body: xlsx binary

## 라이브러리

`restaurant-book-server/build.gradle`에 Apache POI 추가를 권장한다.

```gradle
implementation 'org.apache.poi:poi-ooxml:5.4.1'
```

버전은 구현 시점에 Gradle dependency resolution이 정상 동작하는 안정 버전으로 확인한다.

## 파일 구조

권장 신규 파일:

```text
restaurant-book-server/src/main/java/com/cj/restaurantbook/sale_menu/application/
└── SaleMenuExcelService.java

restaurant-book-server/src/main/java/com/cj/restaurantbook/sale_menu/presentation/dto/
└── SaleMenuExcelRow.java
```

수정 파일:

```text
restaurant-book-server/src/main/java/com/cj/restaurantbook/sale_menu/presentation/SaleMenuController.java
restaurant-book-server/src/main/java/com/cj/restaurantbook/sale_menu/application/SaleMenuService.java
restaurant-book-server/build.gradle
```

## 서비스 설계

### `SaleMenuService`

기존 `findAll(...)`은 `List<SaleMenuResponse>`를 반환하므로 엑셀 생성에는 도메인 목록을 재사용하기 어렵다.

권장:

1. 내부 공통 메서드 `findAllEntities(categoryId, status, visible, keyword)`를 private 또는 package-private으로 분리한다.
2. `findAll(...)`은 기존처럼 응답 DTO로 매핑한다.
3. `SaleMenuExcelService`는 같은 필터 조건으로 조회된 `SaleMenu` 목록을 받아 Excel row로 변환한다.

주의:

- 기존 API 응답 계약은 변경하지 않는다.
- 정렬은 현재 repository 쿼리 순서와 동일하게 유지한다.

### `SaleMenuExcelService`

역할:

- Workbook 생성
- 헤더/데이터 행 작성
- 상태/boolean/order type 라벨 변환
- 컬럼 너비/헤더 스타일/가격 숫자 서식 적용
- `byte[]` 또는 `ByteArrayResource` 반환

권장 메서드:

```java
public byte[] createSaleMenuExcel(List<SaleMenu> menus)
```

## 컬럼 정의

MVP 컬럼:

| 순서 | 헤더 | 값 |
|---:|---|---|
| 1 | ID | `menu.id` |
| 2 | 메뉴명 | `menu.name` |
| 3 | 설명 | `menu.description` 또는 빈 값 |
| 4 | 카테고리 | `menu.category.name` 또는 `미분류` |
| 5 | 가격 | 숫자 |
| 6 | 판매 상태 | `판매중 / 품절 / 숨김` |
| 7 | 매장 주문 | `가능 / 불가` |
| 8 | 포장 주문 | `가능 / 불가` |
| 9 | 조리 필요 | `필요 / 불필요` |
| 10 | 고객 노출 | `노출 / 미노출` |
| 11 | 정렬 순서 | `displayOrder` |
| 12 | 이미지 URL | `imageUrl` 또는 빈 값 |
| 13 | 생성일 | `createdAt` |
| 14 | 수정일 | `updatedAt` |

이미지는 파일 삽입하지 않고 URL만 제공한다. 엑셀 파일 용량과 S3/외부 URL 접근성 문제를 피하기 위함이다.

## 컨트롤러 설계

`SaleMenuController`에 다음 메서드를 추가한다.

```java
@GetMapping("/excel")
public ResponseEntity<byte[]> downloadExcel(
        @RequestParam(required = false) Long categoryId,
        @RequestParam(required = false) SaleMenuStatus status,
        @RequestParam(required = false) Boolean visible,
        @RequestParam(required = false) String keyword
) {
    ...
}
```

주의:

- `@GetMapping("/{id}")`보다 `/excel` 라우트가 먼저 매칭되도록 선언 순서를 확인한다.
- Spring MVC는 일반적으로 더 구체적인 패턴을 우선하지만, 가독성과 안전성을 위해 `/excel`을 `/{id}`보다 위에 둔다.

## 에러 처리

- 조회 결과 0건이어도 빈 엑셀 파일을 내려준다.
- 엑셀 생성 중 예외가 발생하면 500으로 처리한다.
- 별도 비즈니스 에러 코드는 MVP에서 추가하지 않는다.

## 테스트

필수:

- `SaleMenuExcelServiceTest`
  - 헤더 행 생성 확인
  - 상태/boolean 라벨 변환 확인
  - null category/description/imageUrl 처리 확인
  - 0건일 때도 workbook이 열리는지 확인

권장:

- `SaleMenuControllerTest`
  - `GET /api/sale-menus/excel` 권한 확인
  - `Content-Type`, `Content-Disposition` 확인
  - 필터 파라미터 전달 시 기존 목록 API와 같은 대상이 내려오는지 확인
