# 03. 단계별 파일별 체크리스트

## Step 0. 선행 작업 완료 확인

문서:

- `docs-for-필수 기능 개발-3차 mvp/판매 메뉴 카테고리별 순서 바꾸기 구현 계획/README.md`

확인:

- [ ] 관리자 화면에서 카테고리 순서 DnD가 구현되어 있다.
- [ ] 카테고리 순서가 DB에 저장된다.
- [ ] 판매 메뉴 조회가 카테고리 순서를 반영한다.

## Step 1. 고객 메뉴 API 응답 확인

파일:

- `restaurant-book-server/src/main/java/com/cj/restaurantbook/customer_menu/application/CustomerSaleProductService.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/customer_menu/presentation/CustomerSaleProductController.java`
- `restaurant-book-server/src/main/java/com/cj/restaurantbook/customer_menu/presentation/dto/CustomerSaleProductResponse.java`
- `restaurant-book-front/src/entities/customer-sale-product/api/customerSaleProductApi.ts`
- `restaurant-book-front/src/entities/customer-sale-product/model/types.ts`

작업:

1. 고객 메뉴 응답 타입 확인.
2. 카테고리 id/name 포함 여부 확인.
3. 응답 정렬 기준 확인.
4. 숨김/품절/주문 유형 필터 확인.
5. 전체 보기 구현에 현재 응답으로 충분한지 판단.

검증:

- [ ] 응답만으로 카테고리별 그룹핑이 가능하다.
- [ ] 불가능하면 백엔드 응답 보강 범위를 결정한다.

## Step 2. 프론트 상태 모델 확장

파일 후보:

- `restaurant-book-front/src/app/customer/page.tsx`
- 고객 키오스크 화면 컴포넌트 파일

작업:

1. 선택 카테고리 상태에 `ALL` 또는 `all` 값을 추가한다.
2. 초기값은 첫 번째 실제 카테고리로 유지한다.
3. 카테고리 버튼 목록 마지막에 `전체 보기`를 추가한다.

검증:

- [ ] 첫 진입 시 `전체 보기`가 선택되지 않는다.
- [ ] `전체 보기` 버튼이 마지막에 표시된다.

## Step 3. 전체 보기 그룹핑 로직 추가

파일 후보:

- 고객 키오스크 화면 컴포넌트 파일
- 필요 시 `restaurant-book-front/src/features/customer-menu/.../_lib` 또는 local helper

작업:

1. 고객 메뉴 응답을 카테고리별로 그룹핑한다.
2. 응답 순서를 유지하면서 첫 등장 카테고리 순서대로 섹션을 만든다.
3. 카테고리 없는 메뉴 처리 정책을 반영한다.
4. 빈 섹션은 렌더링하지 않는다.

검증:

- [ ] 카테고리 섹션 순서가 관리자 순서와 일치한다.
- [ ] 섹션 내부 메뉴 순서가 기존 목록 순서와 일치한다.
- [ ] 표시할 메뉴가 없으면 빈 상태가 나온다.

## Step 4. 전체 보기 UI 렌더링

파일 후보:

- 고객 키오스크 메뉴 카드 렌더링 컴포넌트

작업:

1. 기존 카테고리별 카드 grid 렌더링을 재사용한다.
2. 전체 보기에서는 섹션 제목 + 카드 grid를 반복 렌더링한다.
3. 카드 클릭/추가 버튼 핸들러는 기존 로직을 그대로 연결한다.

검증:

- [ ] 전체 보기에서도 메뉴를 장바구니에 담을 수 있다.
- [ ] 주문 내역 수량/금액이 정상 갱신된다.
- [ ] 카드 레이아웃이 기존 카테고리 보기와 일관된다.

## Step 5. 주문 유형과 상태 회귀 확인

확인:

- [ ] 매장 선택 시 매장 주문 가능 메뉴만 표시.
- [ ] 포장 선택 시 포장 주문 가능 메뉴만 표시.
- [ ] 품절/숨김 메뉴 정책이 기존과 동일.
- [ ] 숨김 카테고리 메뉴가 전체 보기에도 노출되지 않음.

## Step 6. 브라우저 검증

URL:

- `http://localhost:4200/customer`

시나리오:

1. 고객 페이지 진입.
2. 첫 번째 실제 카테고리가 선택되어 있는지 확인.
3. `전체 보기` 버튼이 마지막에 있는지 확인.
4. `전체 보기` 클릭.
5. 섹션 순서가 관리자 카테고리 순서와 일치하는지 확인.
6. 메뉴를 담고 주문 내역이 갱신되는지 확인.
7. 매장/포장 전환 후 전체 보기 메뉴가 갱신되는지 확인.
8. 좁은 화면에서 섹션 제목과 카드가 겹치지 않는지 확인.

## 명령 검증

프론트:

```bash
cd /Users/terecal/RestaurantBook/restaurant-book-front
npm run lint
```

필요 시:

```bash
cd /Users/terecal/RestaurantBook/restaurant-book-front
npm run build
```

## 완료 정의

- 고객 키오스크에 `전체 보기`가 추가된다.
- 기본 선택은 첫 번째 실제 카테고리다.
- 전체 보기는 카테고리 섹션 기반이다.
- 섹션 순서는 관리자 카테고리 순서와 일치한다.
- 기존 주문 흐름에 회귀가 없다.
