# 02. 프론트 다운로드 UI

## 목표

`/sale-menus` 판매 메뉴 관리 화면에서 현재 필터 조건을 유지한 채 엑셀 파일을 다운로드한다.

BeautyBook의 기존 프론트 `xlsx` 구현을 참고한다.

- `/Users/terecal/beauty-book-hair/beauty-book--front/src/app/sales/page.tsx`
- `/Users/terecal/beauty-book-hair/beauty-book--front/src/features/beauty-service-management/BeautyServiceTable.tsx`

## 파일 구조

수정 파일:

```text
restaurant-book-front/package.json
restaurant-book-front/package-lock.json
restaurant-book-front/src/entities/sale-menu/api/saleMenuApi.ts
restaurant-book-front/src/features/sale-menu-management/SaleMenuManagement.tsx
```

`saleMenuApi.ts`는 백엔드 다운로드 API를 만들지 않는다면 수정하지 않아도 된다.

## 의존성 추가

RestaurantBook 프론트에는 아직 `xlsx`가 없으므로 추가한다.

```bash
cd restaurant-book-front
npm install xlsx
```

BeautyBook은 `xlsx: ^0.18.5`를 사용 중이다. RestaurantBook도 동일 major/minor를 맞춰도 된다.

## 구현 방식

BeautyBook 매출 페이지처럼 동적 import를 권장한다.

```ts
const handleDownloadExcel = async () => {
  const { utils, writeFile } = await import("xlsx");
  const rows = sortedMenus.map((menu) => ({
    ID: menu.id,
    메뉴명: menu.name,
    설명: menu.description ?? "",
    카테고리: menu.category?.name ?? "미분류",
    "가격(원)": menu.price,
    "판매 상태": statusLabel(menu.status),
    "매장 주문": menu.availableDineIn ? "가능" : "불가",
    "포장 주문": menu.availableTakeout ? "가능" : "불가",
    "조리 필요": menu.requiresCooking ? "필요" : "불필요",
    "고객 노출": menu.visible ? "노출" : "미노출",
    "정렬 순서": menu.displayOrder,
    "이미지 URL": menu.imageUrl ?? "",
    생성일: menu.createdAt,
    수정일: menu.updatedAt,
  }));

  const ws = utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 8 },
    { wch: 20 },
    { wch: 32 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 48 },
    { wch: 20 },
    { wch: 20 },
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "판매메뉴");
  writeFile(wb, `판매메뉴_${formatDownloadDate(new Date())}.xlsx`);
};
```

주의:

- 다운로드 대상은 `sortedMenus`를 사용한다. 현재 필터 적용 결과이면서 화면 정렬과 동일하다.
- 이미지 파일은 넣지 않고 URL만 넣는다.
- 엑셀 업로드 코드는 BeautyBook에 있지만 RestaurantBook MVP에서는 가져오지 않는다.

## UI 위치

현재 상단 우측 버튼 영역:

- `카테고리 관리`
- `메뉴 추가`

권장 추가:

- `엑셀 다운로드` 버튼을 `카테고리 관리` 왼쪽에 배치
- 아이콘은 `lucide-react`의 `Download` 사용
- 다운로드 중에는 버튼 disabled + `다운로드 중...`

예상 순서:

```text
[엑셀 다운로드] [카테고리 관리] [+ 메뉴 추가]
```

## 동작

1. 사용자가 필터를 설정한다.
2. 화면이 `GET /api/sale-menus`로 필터 결과를 조회한다.
3. `엑셀 다운로드` 버튼을 누른다.
4. 현재 화면의 `sortedMenus`를 엑셀 row로 변환한다.
5. `xlsx.writeFile`로 파일을 다운로드한다.
6. 성공/실패 토스트 표시.

파일명:

- `판매메뉴_YYYYMMDD_HHmm.xlsx`
- 필터가 있으면 `판매메뉴_필터_YYYYMMDD_HHmm.xlsx`도 가능하다.

## 상태 처리

- 목록 로딩 중에도 다운로드는 가능하나, UX상 `isLoading`이면 비활성화해도 된다.
- 다운로드 중 상태를 별도 state로 두고 중복 클릭을 막는다.
- 메뉴가 0건이면 버튼 disabled 또는 헤더만 있는 파일 다운로드 중 하나를 선택한다.
- 권장: 0건이면 disabled + `다운로드할 메뉴가 없습니다.` 토스트는 생략.
- 실패 시 `toastError(e, "엑셀 다운로드에 실패했습니다.")` 사용.

## 모바일/레이아웃

- 버튼 영역은 이미 `flex flex-wrap justify-end gap-2`이므로 같은 버튼 스타일을 사용하면 줄바꿈 대응 가능하다.
- 버튼 텍스트가 좁은 폭에서 깨지지 않게 `whitespace-nowrap`를 추가한다.

## 검증

브라우저:

- `/sale-menus` 진입 후 다운로드 클릭
- 다운로드 파일 확장자가 `.xlsx`인지 확인
- Excel/Numbers/LibreOffice에서 파일 열림 확인
- 필터 없이 다운로드 시 전체 메뉴 포함
- 카테고리 필터 적용 후 해당 카테고리만 포함
- 상태 필터 `판매중/품절/숨김` 각각 확인
- 노출 필터 `노출/미노출` 각각 확인
- 검색어 필터 적용 확인
- 다운로드 중 중복 클릭 방지 확인
- 빌드 결과에서 `xlsx`가 초기 번들에 과하게 포함되지 않도록 동적 import 사용 확인
