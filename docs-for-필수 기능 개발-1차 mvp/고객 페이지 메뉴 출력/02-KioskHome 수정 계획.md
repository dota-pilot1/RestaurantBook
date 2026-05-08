# KioskHome 수정 계획

## 현재 상태

파일:

```txt
restaurant-book-front/src/features/kiosk/KioskHome.tsx
```

현재 하드코딩 데이터:

```ts
type Category = "set" | "rice" | "side" | "drink";

const categories = [...]
const menuItems = [...]
```

문제:

- 관리자에서 등록한 메뉴가 반영되지 않는다.
- 세트 가격/구성이 DB와 맞지 않는다.
- 세트와 단품이 같은 `id` 체계로 장바구니에 담겨 충돌 가능성이 있다.
- 품절/숨김/매장/포장 노출 정책을 반영하지 않는다.

## 탭 구조

탭 타입을 문자열 enum 대신 명시적인 구조로 둔다.

```ts
type KioskTab =
  | { type: "SET"; label: "세트" }
  | { type: "MENU"; categoryId: number; label: string };
```

탭 생성:

```txt
첫 번째 탭: 세트
이후 탭: visible=true인 sale_menu_categories
```

예시:

```txt
세트
식사
국/찌개
면/분식
사이드
음료
```

## 조회 흐름

주문 유형 또는 탭이 바뀌면 상품을 다시 조회한다.

```txt
orderType=dine-in  -> DINE_IN
orderType=takeout  -> TAKEOUT
tab=SET            -> section=SET
tab=MENU           -> section=MENU&categoryId={id}
```

## 장바구니 구조

기존:

```ts
Record<number, number>
```

변경:

```ts
type CartItemKey = `${"SALE_MENU" | "SALE_MENU_SET"}:${number}`;

type CartItem = {
  type: "SALE_MENU" | "SALE_MENU_SET";
  id: number;
  name: string;
  price: number;
  quantity: number;
};
```

이렇게 해야 단품 `id=1`과 세트 `id=1`이 충돌하지 않는다.

## 카드 표시

공통 표시:

- 이미지
- 이름
- 설명
- 가격
- 추가/감소 버튼

세트 전용 표시:

- `components`를 요약해서 표시

예시:

```txt
육회 비빔밥 x1, 오늘의 반찬 x1, 식혜 x1
```

단품 전용 표시:

- 카테고리명은 탭에서 이미 알 수 있으므로 카드에는 굳이 강조하지 않는다.

## 품절 처리

`status=SOLD_OUT`인 상품:

- 카드에 `품절` 배지 표시
- 추가 버튼 비활성화
- 이미 장바구니에 담긴 상태에서 새 조회 결과가 품절로 바뀌면 결제 전 차단이 필요하다.

MVP에서는:

- 품절 상품은 추가 불가
- 기존 장바구니에 있으면 수량 조정 가능 여부는 후속 주문 API 연동 시 서버 검증으로 막는다.

## 빈 상태

탭에 상품이 없을 때:

```txt
표시할 메뉴가 없습니다.
```

세트 탭에서 없을 때:

```txt
등록된 세트 메뉴가 없습니다.
```

에러 상태:

```txt
메뉴를 불러오지 못했습니다.
```
