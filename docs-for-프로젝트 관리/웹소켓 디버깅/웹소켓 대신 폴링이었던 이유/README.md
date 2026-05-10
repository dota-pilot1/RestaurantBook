# 웹소켓 대신 폴링이었던 이유

작성일: 2026-05-09

## 결론

고객 화면의 WebSocket 연결 자체는 열렸지만, 고객 주문 topic 구독이 안정적으로 등록되지 않았다. 그래서 주방에서 주문을 취소해도 고객 화면은 WebSocket 이벤트를 받지 못했고, React Query의 주기적 조회가 도는 시점에야 취소 상태를 반영했다.

최종 수정은 클라이언트가 WebSocket을 열 때 `topic`을 URL query로 함께 보내고, 서버가 handshake 직후 해당 topic을 자동 구독하도록 만든 것이다.

```text
기존:
Browser -> /ws/app 연결
Browser -> SUBSCRIBE 프레임 전송
Server  -> topicSessions 등록

수정 후:
Browser -> /ws/app?topic=customer:orders/{tableName} 연결
Server  -> handshake 직후 topicSessions 등록
```

## 증상

- 고객이 주문하면 주방 화면에는 거의 즉시 표시됐다.
- 주방에서 주문을 취소하면 고객 화면은 바로 사라지지 않았다.
- 고객 화면의 주문은 폴링 주기에 맞춰 늦게 사라졌다.
- 고객 화면에 임시로 띄운 `실시간 진단` 패널에서 `WS` 시간은 갱신되지 않고, `취소 폴링` 시간에 맞춰 화면이 바뀌는 것이 확인됐다.

## 왜 주문 생성은 빨랐나

고객 주문 생성은 주방/운영 topic인 `orders:operations`로 전파된다. 주방 화면은 이 topic을 구독하고 있었고, 주문 생성 이벤트는 정상적으로 수신했다.

문제가 된 흐름은 반대 방향이었다.

```text
주방 취소
-> 서버: customer:orders/{tableName} topic으로 CUSTOMER_ORDERS_CHANGED 발행
-> 고객 화면: 해당 topic 구독이 등록되어 있어야 즉시 반응
-> 실제: 고객 세션이 topicSessions에 없어서 메시지 미수신
-> 20초 폴링으로만 뒤늦게 반영
```

## 확인 과정

1. 운영 WebSocket handshake 자체는 `101 Switching Protocols`로 열리는 것을 확인했다.
2. 고객 화면에 `WS`, `활성 폴링`, `취소 폴링` 시간을 직접 표시했다.
3. 주방 취소 시 `WS`는 갱신되지 않고 `취소 폴링`에 맞춰 화면이 바뀌는 것을 확인했다.
4. Node WebSocket으로 운영 서버에 직접 `customer:orders/{테이블}`을 구독한 뒤 주문 생성/취소를 재현했다.
5. 수정 전에는 WebSocket 연결은 열렸지만 메시지가 0개였다.
6. `PING`을 보내도 `PONG`이 오지 않아, 연결 이후 클라이언트 -> 서버 프레임 처리에 의존하는 방식이 문제임을 좁혔다.
7. handshake query에 `topic`을 실어 서버가 연결 직후 자동 구독하도록 바꾼 뒤 재현 테스트에서 `CREATED`, `CANCELED`를 즉시 수신했다.

## 최종 수정

### 프론트엔드

파일: `restaurant-book-front/src/shared/hooks/useAppWebSocket.ts`

- WebSocket URL 생성 시 현재 구독 topic을 `topic` query parameter로 추가했다.
- 인증이 필요한 topic만 token을 붙이도록 분리했다.
- 새 topic이 생기거나 인증 여부가 바뀌면 socket을 재연결하게 했다.
- 첫 연결 타이밍에 topic이 비어 있지 않도록 `acquire()`를 다음 tick에 실행하게 했다.

핵심 형태:

```ts
const httpUrl = new URL("/ws/app", base);
if (token) {
  httpUrl.searchParams.set("token", token);
}
this.subscriptions.forEach((_, topic) => {
  httpUrl.searchParams.append("topic", topic);
});
```

### 백엔드

파일: `restaurant-book-server/src/main/java/com/cj/restaurantbook/websocket/AppWebSocketHandler.java`

- `afterConnectionEstablished`에서 URL query의 `topic`을 읽는다.
- 읽은 topic을 기존 `handleSubscribe()`로 넘겨 같은 권한/지원 topic 검증을 태운다.
- 결과적으로 `SUBSCRIBE` 프레임이 늦거나 처리되지 않아도 handshake 직후 topic 구독이 등록된다.

핵심 형태:

```java
@Override
public void afterConnectionEstablished(WebSocketSession session) {
    subscribeHandshakeTopics(session);
    log.debug("WS connected: sessionId={} role={}", session.getId(), session.getAttributes().get("role"));
}
```

## 배포 및 검증

배포는 2026-05-09에 완료했다.

- 백엔드 JAR 빌드: `./gradlew build -x test`
- EC2 업로드: `~/app.jar`
- 서비스 재시작: `restaurantbook`
- 프론트 빌드: `NEXT_PUBLIC_API_URL=https://smart-fnb-design.com NEXT_PUBLIC_ENABLE_TEST_LOGIN=true npm run build`
- S3 sync: `s3://restaurant-book-front`
- CloudFront invalidation: `I98DRZG9POLQ7XXK6N0W0DV7JH`

운영 재현 테스트 결과:

```text
WS open customer:orders/WS검증-...
WS message CUSTOMER_ORDERS_CHANGED reason=CREATED
WS message CUSTOMER_ORDERS_CHANGED reason=CANCELED
Summary messages=2
```

브라우저 운영 화면에서도 주방 취소가 고객 화면에 즉시 반응하는 것을 확인했다.

## 같이 확인했던 주변 문제

이번 최종 지연 원인은 topic 구독 문제였지만, 디버깅 중 다음 문제들도 함께 확인했다.

- CloudFront에 `/ws/*` behavior가 없으면 WebSocket 경로가 S3로 갈 수 있다.
- Spring WebSocket origin 검증은 일반 CORS와 별도라 `cors.allowed-origin`에 프론트 origin이 필요하다.
- 고객 화면은 익명 topic을 구독하므로 오래된 로그인 token을 무조건 붙이면 handshake가 거부될 수 있다.
- 로컬에서는 `http://localhost:4200` origin이 허용 목록에 있어야 한다.

## 재발 방지

- WebSocket은 `101`만 확인하면 부족하다. 실제 topic 메시지 수신까지 확인해야 한다.
- 고객/주방/직원 각 화면별로 `CREATED`, `CANCELED`, `READY`, `COMPLETED` 이벤트가 어느 topic으로 가는지 표로 관리한다.
- 실시간 버그를 볼 때는 `마지막 WS 수신 시각`과 `마지막 폴링 시각`을 같이 찍으면 원인 분리가 빠르다.
- 임시 `실시간 진단` 패널은 문제 확인 후 제거 대상이다.

