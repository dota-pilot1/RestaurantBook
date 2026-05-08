# BeautyBook 참고 파일

## 백엔드

| 용도 | 파일 |
| --- | --- |
| 메일 의존성 | `/Users/terecal/beauty-book-hair/beauty-book-server/build.gradle` |
| Gmail SMTP 설정 | `/Users/terecal/beauty-book-hair/beauty-book-server/src/main/resources/application.yaml` |
| 이메일 인증 서비스 | `/Users/terecal/beauty-book-hair/beauty-book-server/src/main/java/com/cj/beautybook/auth/application/EmailVerificationService.java` |
| 이메일 인증 엔티티 | `/Users/terecal/beauty-book-hair/beauty-book-server/src/main/java/com/cj/beautybook/auth/domain/EmailVerification.java` |
| 이메일 인증 API | `/Users/terecal/beauty-book-hair/beauty-book-server/src/main/java/com/cj/beautybook/auth/presentation/EmailVerificationController.java` |
| 메일 발송 구현 | `/Users/terecal/beauty-book-hair/beauty-book-server/src/main/java/com/cj/beautybook/notification/application/EmailNotificationService.java` |
| Security permitAll 경로 | `/Users/terecal/beauty-book-hair/beauty-book-server/src/main/java/com/cj/beautybook/config/SecurityConfig.java` |

## 프론트엔드

| 용도 | 파일 |
| --- | --- |
| 인증 API | `/Users/terecal/beauty-book-hair/beauty-book--front/src/entities/user/api/authApi.ts` |
| 회원가입 인증 UI | `/Users/terecal/beauty-book-hair/beauty-book--front/src/features/auth/signup/SignupForm.tsx` |
| 비밀번호 재설정 UI | `/Users/terecal/beauty-book-hair/beauty-book--front/src/features/auth/login/ForgotPasswordDialog.tsx` |

## 가져올 포인트

- `spring-boot-starter-mail` 의존성
- `spring.mail.host=smtp.gmail.com`
- 인증코드 6자리 생성
- 인증코드 만료 시간 5분
- 실패 횟수 제한
- 인증 성공 후 짧은 수명의 verified token 발급
- 프론트에서 `send-code -> verify-code -> signup` 순서로 진행

## 그대로 쓰면 안 되는 포인트

BeautyBook은 이메일 중심 구조다.

```text
users.email
users.password_hash
userRepository.findByEmail(...)
```

RestaurantBook은 이 구조를 그대로 가져오면 나중에 SMS 전환이 어려워진다.

RestaurantBook에서는 다음 기준으로 바꿔야 한다.

```text
auth_accounts.provider_type = EMAIL
auth_accounts.identifier = 이메일
auth_accounts.password_hash = 비밀번호 해시
auth_verifications.destination = 이메일
auth_verifications.code_hash = 인증코드 해시
```

