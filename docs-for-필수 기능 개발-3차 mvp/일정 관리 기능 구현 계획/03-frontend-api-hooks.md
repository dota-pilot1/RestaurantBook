# 03. 프론트 API + Query Hook

## 신규 디렉터리

```
restaurant-book-front/src/entities/admin-calendar/
├── api/
│   └── adminCalendarApi.ts
└── model/
    ├── types.ts
    └── useAdminCalendar.ts
```

BeautyBook의 `entities/admin-calendar`를 그대로 참고한다.

## 타입

파일: `restaurant-book-front/src/entities/admin-calendar/model/types.ts`

```ts
export type AdminCalendarEntryType = "NOTICE" | "HOLIDAY" | "EVENT" | "MEMO";

export type AdminCalendarEntry = {
  id: number;
  scheduleDate: string;
  type: AdminCalendarEntryType;
  title: string;
  timeText: string | null;
  content: string | null;
  createdBy: number;
  createdByName: string | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdminCalendarEntryBody = {
  scheduleDate: string;
  type: AdminCalendarEntryType;
  title: string;
  timeText?: string | null;
  content?: string | null;
};

export type UpdateAdminCalendarEntryBody = CreateAdminCalendarEntryBody;
```

날짜는 `Date` 객체로 들고 다니지 않고 `YYYY-MM-DD` 문자열로 유지한다. 모든 날짜는 **Asia/Seoul 캘린더 날짜**로 해석한다 ([01-backend-db-domain.md](./01-backend-db-domain.md) 시간대 합의 참조).

`createdByName`은 백엔드에서 등록 시점 사용자 이름을 denormalized 저장한 값이다. MVP 화면에서 표기하지 않더라도 타입에는 포함해 두어 후속 노출이 가능하게 한다.

## API client

파일: `restaurant-book-front/src/entities/admin-calendar/api/adminCalendarApi.ts`

```ts
import { api } from "@/shared/api/axios";
import type {
  AdminCalendarEntry,
  CreateAdminCalendarEntryBody,
  UpdateAdminCalendarEntryBody,
} from "../model/types";

export const adminCalendarApi = {
  list: (from: string, to: string) =>
    api
      .get<AdminCalendarEntry[]>("/api/admin/calendar/entries", {
        params: { from, to },
      })
      .then((r) => r.data),

  create: (body: CreateAdminCalendarEntryBody) =>
    api
      .post<AdminCalendarEntry>("/api/admin/calendar/entries", body)
      .then((r) => r.data),

  update: (id: number, body: UpdateAdminCalendarEntryBody) =>
    api
      .put<AdminCalendarEntry>(`/api/admin/calendar/entries/${id}`, body)
      .then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/api/admin/calendar/entries/${id}`).then((r) => r.data),
};
```

RestaurantBook의 `api` 인스턴스는 `NEXT_PUBLIC_API_URL` 또는 `http://localhost:4201`을 사용하고, 인증 토큰을 자동으로 붙인다.

## Query hook

파일: `restaurant-book-front/src/entities/admin-calendar/model/useAdminCalendar.ts`

```ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminCalendarApi } from "../api/adminCalendarApi";
import type {
  CreateAdminCalendarEntryBody,
  UpdateAdminCalendarEntryBody,
} from "./types";

const ROOT_KEY = ["admin-calendar"] as const;

export function useAdminCalendarEntries(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: [...ROOT_KEY, "range", from, to],
    queryFn: () => adminCalendarApi.list(from, to),
    enabled: enabled && Boolean(from) && Boolean(to),
    staleTime: 30_000,
  });
}

export function useCreateAdminCalendarEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAdminCalendarEntryBody) => adminCalendarApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT_KEY }),
  });
}

export function useUpdateAdminCalendarEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateAdminCalendarEntryBody }) =>
      adminCalendarApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT_KEY }),
  });
}

export function useDeleteAdminCalendarEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminCalendarApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT_KEY }),
  });
}
```

## 검증

- [ ] TypeScript import alias `@/entities/admin-calendar/...` 정상
- [ ] 관리자 로그인 상태에서 list API 호출 시 200
- [ ] 토큰 만료 시 기존 axios refresh 흐름으로 복구
- [ ] create/update/delete 성공 후 `["admin-calendar"]` 쿼리 invalidate
- [ ] `npm run lint` 통과
