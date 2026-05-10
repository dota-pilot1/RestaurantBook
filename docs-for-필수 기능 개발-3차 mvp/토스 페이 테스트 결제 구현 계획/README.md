# 토스 페이 테스트 결제 구현 계획

## 목표

토스페이먼츠 테스트 키로 고객 키오스크의 `READY(조리 완료/결제 대기)` 주문에 실제 테스트 결제 흐름을 붙인다.

이번 범위는 시범 케이스이므로 결제 버튼, 토스 결제창 호출, 서버 승인, 금액 검증, 기존 주문 완료/매출 반영까지 연결한다. 환불은 기존 운영 환불 API를 유지하고, 토스 결제 취소 API 연동은 후속 범위로 분리한다.

## 결론

- 고객 화면 우측 하단 버튼 영역에서 `직원 호출` 왼쪽에 `결제` 버튼을 추가한다.
- 결제 버튼은 결제 가능한 주문이 있을 때만 활성화한다.
- 토스 클라이언트 키는 브라우저에서 사용하고, 시크릿 키는 백엔드 서버에서만 사용한다.
- 결제 성공 리다이렉트 후 서버가 주문 금액을 DB 기준으로 다시 검증하고 토스 승인 API를 호출한다.
- 승인 완료 후 기존 `Payment` 저장과 `Order COMPLETED` 전환을 재사용한다.

## 문서 구성

- [00-overview.md](00-overview.md): 전체 흐름과 범위
- [01-backend-payment-confirm.md](01-backend-payment-confirm.md): 백엔드 승인 API, 토스 API 호출, 결제 완료 처리
- [02-frontend-kiosk-payment.md](02-frontend-kiosk-payment.md): 고객 키오스크 결제 버튼, SDK 호출, 결과 화면
- [03-env-deploy.md](03-env-deploy.md): 환경변수와 배포 반영
- [04-step-by-step-checklist.md](04-step-by-step-checklist.md): 단계별 작업 체크리스트
- [추후 실결제 구현에 대한 참고사항.md](추후%20실결제%20구현에%20대한%20참고사항.md): 실결제 전환 전 결제 도메인 확장 포인트
- [payment-domain-erd.mmd](payment-domain-erd.mmd): 결제 도메인 ERD
- [다음 세션 구현 지시어.md](다음%20세션%20구현%20지시어.md): 다음 작업 세션용 구현 지시어

## 참고 공식 문서

- 토스페이먼츠 결제위젯 가이드: https://docs.tosspayments.com/en/integration-widget
- 토스페이먼츠 LLM Quick Reference: https://docs.tosspayments.com/guides/v2/get-started/llms-quick-reference
