# 구글 이메일 참고 자료

Gmail SMTP로 이메일 인증코드를 보내는 구현 참고 자료다.

목표는 BeautyBook의 이메일 인증 흐름을 참고하되, RestaurantBook은 `auth_accounts`, `auth_verifications` 구조에 맞게 구현하는 것이다.

## 문서

1. [BeautyBook 참고 파일](./01-BeautyBook-참고-파일.md)
2. [RestaurantBook 적용 계획](./02-RestaurantBook-적용-계획.md)

## 핵심 판단

- 참고 가능: Gmail SMTP 설정, 인증코드 발송 API, 프론트 인증 UI
- 그대로 복사 금지: `users.email` 중심 인증 구조
- RestaurantBook 기준: 이메일은 `auth_accounts.identifier`, 인증코드는 `auth_verifications.code_hash`에 저장

