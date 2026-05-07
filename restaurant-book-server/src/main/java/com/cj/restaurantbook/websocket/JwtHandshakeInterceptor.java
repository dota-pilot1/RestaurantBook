package com.cj.restaurantbook.websocket;

import com.cj.restaurantbook.auth.jwt.JwtTokenProvider;
import com.cj.restaurantbook.auth.jwt.TokenType;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {
        String token = resolveToken(request);
        if (token == null) {
            attributes.put("anonymous", true);
            return true;
        }

        try {
            Claims claims = jwtTokenProvider.parse(token).getPayload();
            if (jwtTokenProvider.getType(claims) != TokenType.ACCESS) {
                log.warn("WS handshake rejected: not access token");
                return false;
            }
            attributes.put("userId", jwtTokenProvider.getUserId(claims));
            attributes.put("username", jwtTokenProvider.getUsername(claims));
            attributes.put("role", jwtTokenProvider.getRole(claims));
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("WS handshake rejected: invalid token ({})", e.getMessage());
            return false;
        }
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception
    ) {
        // no-op
    }

    private String resolveToken(ServerHttpRequest request) {
        if (request instanceof ServletServerHttpRequest servletRequest) {
            String tokenParam = servletRequest.getServletRequest().getParameter("token");
            if (tokenParam != null && !tokenParam.isBlank()) {
                return tokenParam;
            }
        }

        var authHeaders = request.getHeaders().get("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String header = authHeaders.get(0);
            if (header != null && header.startsWith("Bearer ")) {
                return header.substring(7);
            }
        }
        return null;
    }
}
