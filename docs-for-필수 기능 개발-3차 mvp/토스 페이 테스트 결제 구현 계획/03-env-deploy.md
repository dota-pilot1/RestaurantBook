# 03. 환경변수와 배포

## 현재 상태

`docs-for-배포 가이드/.env.prod`에 토스 테스트 키가 저장되어 있다.

다만 systemd `EnvironmentFile`로 읽히려면 아래처럼 `KEY=VALUE` 형식이어야 한다.

```env
TOSS_PAYMENTS_CLIENT_KEY=test_ck_...
TOSS_PAYMENTS_SECRET_KEY=test_sk_...
TOSS_PAYMENTS_SECURITY_KEY=...
```

현재처럼 한국어 라벨과 값이 별도 줄이면 서버 환경변수로 적용되지 않는다.

## 백엔드 환경변수

필수:

```env
TOSS_PAYMENTS_CLIENT_KEY=
TOSS_PAYMENTS_SECRET_KEY=
```

선택:

```env
TOSS_PAYMENTS_API_BASE_URL=https://api.tosspayments.com
TOSS_PAYMENTS_SECURITY_KEY=
```

`TOSS_PAYMENTS_SECURITY_KEY`는 이번 승인 API 구현에는 사용하지 않는다. 웹훅 검증이나 추가 보안 연동이 필요할 때 후속으로 사용한다.

## 프론트 환경변수

이번 설계에서는 프론트에 토스 키를 직접 환경변수로 넣지 않는다.

이유:

- 배포된 정적 프론트에서 `NEXT_PUBLIC_*`로 키를 박으면 교체가 번거롭다.
- 클라이언트 키는 공개 가능하지만, 백엔드 설정 조회 API로 내려주면 운영/테스트 키 전환이 단순하다.
- 시크릿 키는 절대 프론트에 들어가지 않는다.

## 배포 절차

1. `docs-for-배포 가이드/.env.prod`를 `KEY=VALUE` 형식으로 정리한다.
2. 백엔드 배포 가이드대로 `.env.prod`를 EC2 `~/.env`로 업로드한다.
3. 백엔드 JAR를 빌드/업로드한다.
4. `sudo systemctl restart restaurantbook`로 재시작한다.
5. `journalctl -u restaurantbook -f`로 토스 설정 누락 오류가 없는지 확인한다.
6. 프론트를 빌드하고 S3/CloudFront에 배포한다.
7. 고객 키오스크에서 READY 주문을 만든 뒤 테스트 결제를 수행한다.

## 운영 전환 시 주의

- 테스트 키는 실제 과금되지 않는다.
- 라이브 키 전환 시 `.env.prod`만 라이브 키로 바꾸고 서버를 재시작한다.
- 라이브 전환 전에는 토스 개발자센터의 결제 UI 설정, 허용 도메인, 리다이렉트 URL, 웹훅 여부를 다시 확인한다.

