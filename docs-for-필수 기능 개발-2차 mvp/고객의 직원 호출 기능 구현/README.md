# 고객의 직원 호출 기능 구현

작성일: 2026-05-08

## 문서

| 파일 | 내용 |
|------|------|
| [00-overview.md](./00-overview.md) | 전체 개요, 사용자 질문 답변, 아키텍처, 파일 변경 요약 |
| [01-backend-domain.md](./01-backend-domain.md) | `staff_call` 도메인 엔티티, 상태 머신, Repository, 스키마 |
| [02-backend-api.md](./02-backend-api.md) | API 명세, Service, Broadcaster, WebSocket 토픽 |
| [03-frontend-customer.md](./03-frontend-customer.md) | KioskHome 직원 호출 버튼/다이얼로그/상태 패널 |
| [04-frontend-staff.md](./04-frontend-staff.md) | 직원 보드 호출 알림 버튼 + 처리 다이얼로그 |
| [05-frontend-manager.md](./05-frontend-manager.md) | 매니저 대시보드 미처리 호출 메트릭 |
| [06-step-by-step.md](./06-step-by-step.md) | 단계별 작업 순서 + 검증 체크리스트 |

## 핵심 결정 요약

- 신규 도메인 `staff_call` (Order에 합치지 않음).
- 기존 WebSocket 토픽 컨벤션 그대로: `staff-calls:operations`, `customer:calls/{tableName}`.
- 상태: `PENDING → ACKNOWLEDGED | CANCELED`.
- 호출 유형: `GENERAL / REFILL / QUESTION / PAYMENT / OTHER` + 자유 메시지(200자).
- 1분 내 중복 호출 차단 (서버).
- 매니저는 **응대 주체 아님** → 카운트 모니터링 + 빠른 이동만.

## 흐름 요약

```
고객 키오스크                서버                  직원 보드           매니저
    │                        │                       │                │
    │ POST /staff-calls      │                       │                │
    ├───────────────────────▶│                       │                │
    │                        │  WS: STAFF_CALL_      │                │
    │                        │     LIST_CHANGED      │                │
    │                        ├──────────────────────▶│ 호출(N) 깜빡임  │
    │                        │                       │   + 사운드     │
    │                        │                       │                │
    │                        │  invalidate           │                │
    │                        │  manager-dashboard    │                │
    │                        ├───────────────────────┼───────────────▶│ 카운트 갱신
    │ "호출 중" 패널 표시     │                       │                │
    │                        │                       │ acknowledge    │
    │                        │◀──────────────────────┤ 클릭           │
    │                        │                       │                │
    │  WS: CUSTOMER_CALLS_   │                       │                │
    │      CHANGED           │                       │                │
    │◀───────────────────────┤                       │                │
    │ 패널 사라짐 + 토스트    │                       │ 목록 갱신       │ 카운트 -1
```
