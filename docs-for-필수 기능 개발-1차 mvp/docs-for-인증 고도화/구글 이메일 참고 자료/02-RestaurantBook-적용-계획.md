# RestaurantBook 적용 계획

## 목표

이메일 가입/로그인을 먼저 구현한다.

단, 내부 구조는 나중에 SMS 가입으로 바꾸기 쉽게 만든다.

## 1단계. 테이블 추가

추가할 테이블:

```text
auth_accounts
auth_verifications
```

`users.email`, `users.password_hash`에 인증을 계속 묶지 않는다.

권장 매핑:

| 현재 개념 | 새 위치 |
| --- | --- |
| 이메일 | `auth_accounts.identifier` |
| 비밀번호 해시 | `auth_accounts.password_hash` |
| 이메일 인증 여부 | `auth_accounts.verified` |
| 인증코드 | `auth_verifications.code_hash` |

## 2단계. 이메일 인증 API

추가할 API:

```text
POST /api/auth/email/send-code
POST /api/auth/email/verify-code
```

흐름:

```text
send-code
-> auth_verifications 생성
-> Gmail SMTP로 인증코드 발송

verify-code
-> code_hash 검증
-> verifiedToken 발급
```

## 3단계. 회원가입 API 수정

회원가입 요청은 이메일을 받더라도 내부 저장은 `auth_accounts` 기준으로 한다.

```text
1. verifiedToken 검증
2. users 생성
3. auth_accounts 생성
   - provider_type = EMAIL
   - identifier = 이메일
   - password_hash = bcrypt 해시
   - verified = true
4. refresh_tokens 생성
```

`users`와 `auth_accounts`는 같은 트랜잭션에서 생성한다.

## 4단계. 로그인 API 수정

처음에는 화면 이름은 이메일 로그인이어도 된다.

서버 내부 조회는 이렇게 바꾼다.

```text
authAccountRepository.findByProviderTypeAndIdentifier(EMAIL, email)
```

그 뒤 연결된 `user`를 가져와 JWT를 발급한다.

JWT subject는 이메일보다 `userId` 기준이 낫다.

## 5단계. Gmail SMTP 설정

`build.gradle`:

```gradle
implementation 'org.springframework.boot:spring-boot-starter-mail'
```

`application.yaml`:

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${MAIL_USERNAME:}
    password: ${MAIL_PASSWORD:}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true
      mail.smtp.connectiontimeout: 5000
      mail.smtp.timeout: 5000
      mail.smtp.writetimeout: 5000
```

Gmail은 일반 비밀번호가 아니라 앱 비밀번호를 사용한다.

## 6단계. 프론트 적용

BeautyBook의 흐름을 참고한다.

```text
이메일 입력
-> 인증코드 발송
-> 인증코드 입력
-> 인증 완료
-> 비밀번호/이름 입력
-> 회원가입
```

프론트 API는 우선 이메일 이름을 유지해도 된다.

나중에 SMS까지 고려하면 내부 타입은 점진적으로 아래처럼 바꾼다.

```ts
type AuthProviderType = "EMAIL" | "PHONE" | "GOOGLE";
```

## 구현 후 리뷰 포인트

- `users.email` 의존이 남아 있는지
- `UserRepository.findByEmail` 의존이 인증 로직에 남아 있는지
- 인증코드 원문을 DB에 저장하지 않는지
- `provider_type + identifier` 유니크 제약이 있는지
- 이메일 인증 API가 permitAll에 등록되어 있는지
- SMS 추가 시 `PHONE` provider만 추가하면 되는지

