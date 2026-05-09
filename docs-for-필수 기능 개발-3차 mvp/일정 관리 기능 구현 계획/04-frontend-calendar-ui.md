# 04. 프론트 캘린더 UI

## 신규 페이지 구조

```
restaurant-book-front/src/app/admin/calendar/
├── page.tsx
├── _lib/
│   └── calendar.ts
└── _components/
    ├── CalendarGrid.tsx
    ├── EntryTable.tsx
    ├── AdminCalendarEntryFormDialog.tsx
    └── typeMeta.ts
```

BeautyBook의 파일 구성을 그대로 가져오되, RestaurantBook에는 `FormDialog`가 없으므로 모달은 기존 `SaleMenuFormDialog`, `PermissionFormDialog`처럼 직접 overlay로 만든다.

## `page.tsx`

파일: `restaurant-book-front/src/app/admin/calendar/page.tsx`

역할:
- `RequireRole roles={["ROLE_ADMIN"]}` 가드
- 현재 월 cursor 상태
- 선택 날짜 상태
- dialog 상태
- 월 범위 API 호출
- 캘린더 점 데이터 생성
- 날짜 필터링

구조:

```tsx
"use client";

export default function AdminCalendarPage() {
  return (
    <RequireRole roles={["ROLE_ADMIN"]}>
      <AdminCalendarPageInner />
    </RequireRole>
  );
}
```

화면 문구는 BeautyBook의 `관리자 일정 관리`보다 RestaurantBook에 맞춰 아래처럼 변경한다.

- H1: `운영 일정 관리`
- 설명: `휴무, 프로모션, 단체예약, 발주/점검 메모 등 매장 운영 일정을 관리합니다.`
- eyebrow: `OPERATIONS CALENDAR`

## `calendar.ts`

파일: `restaurant-book-front/src/app/admin/calendar/_lib/calendar.ts`

BeautyBook과 동일하게 가져간다.

- `ymd(d: Date): string`
- `todayKST(): string`
- `buildCells(year: number, month: number): CalendarCell[]`
- `monthRange(cells: CalendarCell[]): { from: string; to: string }`
- `weekdayKo(dateStr: string): { label: string; index: number }`

주의:
- `todayKST()`는 `Asia/Seoul` 기준.
- 날짜 input과 API 요청은 전부 `YYYY-MM-DD`.

## `typeMeta.ts`

파일: `restaurant-book-front/src/app/admin/calendar/_components/typeMeta.ts`

BeautyBook의 enum 순서를 유지하되 라벨과 아이콘을 식당 운영형으로 바꾼다.

권장:

```ts
export const TYPE_META: Record<AdminCalendarEntryType, TypeMeta> = {
  NOTICE:  { label: "공지", icon: Megaphone, chip: "...", dot: "bg-amber-500" },
  HOLIDAY: { label: "휴무", icon: CalendarOff, chip: "...", dot: "bg-rose-500" },
  EVENT:   { label: "이벤트", icon: PartyPopper, chip: "...", dot: "bg-violet-500" },
  MEMO:    { label: "메모", icon: ClipboardList, chip: "...", dot: "bg-sky-500" },
};
```

RestaurantBook은 단색 위주 화면이 많으므로 타입 점 색상만 적당히 구분하고, 전체 배경은 `bg-background`, `bg-muted`, `border-border`, `text-muted-foreground`를 우선 사용한다.

## `CalendarGrid.tsx`

BeautyBook과 거의 동일하게 사용한다.

Props:
- `monthLabel`
- `cells`
- `today`
- `selectedDate`
- `countsByDate`
- `onSelectDate`
- `onPrev`
- `onNext`
- `onToday`

UI 규칙:
- 한 셀에는 일정 제목을 넣지 않는다.
- 타입별 점만 표시한다.
- 오늘은 원형 강조.
- 선택일은 border/ring으로 강조.
- 일요일은 rose, 토요일은 sky 색상.
- 모바일에서는 7열 유지하되 셀 높이를 너무 키우지 않는다.

## `EntryTable.tsx`

BeautyBook과 동일한 역할이다.

Props:
- `entries`
- `totalCount`
- `selectedDate`
- `onClearFilter`
- `onClickRow`
- `onClickAddNew`

표 컬럼:
- 날짜
- 타입
- 시간
- 제목

빈 상태 문구:
- 전체 월: `이 달에 등록된 일정이 없습니다.`
- 날짜 필터: `이 날짜에 등록된 일정이 없습니다.`

추가 버튼:
- 라벨 `새 일정`
- 아이콘 `Plus`

## `AdminCalendarEntryFormDialog.tsx`

BeautyBook의 다이얼로그 로직을 가져오되 RestaurantBook modal 스타일로 작성한다.

Props:

```ts
type Props = {
  open: boolean;
  mode: "create" | "edit";
  entry?: AdminCalendarEntry | null;
  defaultDate?: string;
  onClose: () => void;
};
```

zod schema:

```ts
const schema = z.object({
  scheduleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["NOTICE", "HOLIDAY", "EVENT", "MEMO"] as const),
  title: z.string().min(1, "제목을 입력해주세요.").max(120),
  timeText: z.string().max(40, "시간은 40자 이내여야 합니다.").optional(),
  content: z.string().max(4000).optional(),
});
```

입력 placeholder:
- 제목: `예) 주말 단체예약 / 신메뉴 프로모션 / 임시 휴무`
- 시간: `예) 10:00, 14:00~16:00, 점심 이후`
- 내용: `공유할 운영 메모를 입력합니다.`

저장 동작:
- `PUT`은 **전체 교체 시맨틱**이므로 모달에서 모든 필드를 다시 보낸다 (현재 form이 그렇게 동작).
- 작성자 표기는 MVP에서 노출하지 않지만, 응답 타입에는 `createdByName`, `updatedBy`가 포함되어 있어 후속 화면 변경만으로 노출 가능하다.

`time_text` 자유 텍스트 한계:
- 검색·정렬·다국어가 약하다.
- 후속에 `RESERVATION` 타입을 분리할 때 `LocalTime startAt/endAt`로 바꿀 가능성이 있음 ([00-overview.md](./00-overview.md) 비목표 참조).

삭제:
- edit 모드에서만 `삭제` 버튼 노출
- 기존 `ConfirmDialog` 재사용
- 삭제 성공 시 toast + query invalidate + close

## 검증

- [ ] `/admin/calendar` 직접 진입 시 관리자만 화면 표시
- [ ] 이번 달 진입 시 `GET /api/admin/calendar/entries?from=...&to=...` 호출
- [ ] 이전/다음/오늘 버튼 동작
- [ ] 날짜 클릭 시 우측 목록 필터
- [ ] 같은 날짜 재클릭 시 필터 해제
- [ ] `새 일정` 등록 성공 후 캘린더 점과 목록 갱신
- [ ] 목록 행 클릭 후 수정 성공
- [ ] 수정 모달에서 삭제 성공
- [ ] 390px 모바일 폭에서 표가 가로 스크롤되거나 깨지지 않음
- [ ] `npm run lint` 통과
