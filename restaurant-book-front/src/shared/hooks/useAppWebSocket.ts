"use client";

import { useEffect, useRef } from "react";
import { tokenStorage } from "@/shared/api/tokenStorage";

export type AppWsEnvelope = {
  type: string;
  topic: string | null;
  data: unknown;
};

export type AppWsListener = (message: AppWsEnvelope) => void;

class AppWsManager {
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, Set<AppWsListener>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private refCount = 0;
  private currentToken: string | null = null;
  private refreshInFlight: Promise<boolean> | null = null;

  acquire() {
    this.refCount++;
    if (this.refCount === 1) {
      this.scheduleConnect();
    }
  }

  release() {
    this.refCount = Math.max(0, this.refCount - 1);
    if (this.refCount === 0) {
      this.teardown();
    }
  }

  subscribe(topic: string, listener: AppWsListener) {
    let listeners = this.subscriptions.get(topic);
    const isNewTopic = !listeners;
    if (!listeners) {
      listeners = new Set();
      this.subscriptions.set(topic, listeners);
    }
    listeners.add(listener);

    if (this.needsReconnectForAuth() || (isNewTopic && this.isSocketActive())) {
      this.ws?.close();
      return;
    }

    if (isNewTopic) {
      this.send({ type: "SUBSCRIBE", topic, data: null });
    }
  }

  unsubscribe(topic: string, listener: AppWsListener) {
    const listeners = this.subscriptions.get(topic);
    if (!listeners) {
      return;
    }
    listeners.delete(listener);
    if (listeners.size === 0) {
      this.subscriptions.delete(topic);
      if (this.needsReconnectForAuth() || this.isSocketActive()) {
        this.ws?.close();
        return;
      }
      this.send({ type: "UNSUBSCRIBE", topic, data: null });
    }
  }

  refreshToken() {
    const nextToken = this.shouldAuthenticate() ? tokenStorage.getAccess() : null;
    if (nextToken !== this.currentToken) {
      this.ws?.close();
    }
  }

  private connect() {
    if (this.refCount === 0) {
      return;
    }
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.currentToken = this.shouldAuthenticate() ? tokenStorage.getAccess() : null;
    let opened = false;
    try {
      this.ws = new WebSocket(this.buildUrl(this.currentToken));
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      opened = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.subscriptions.forEach((_, topic) => {
        this.send({ type: "SUBSCRIBE", topic, data: null });
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as AppWsEnvelope;
        if (!message.topic) {
          return;
        }
        this.subscriptions.get(message.topic)?.forEach((listener) => listener(message));
      } catch {
        // ignore malformed frames
      }
    };

    this.ws.onclose = () => {
      void this.handleClose(opened);
    };
  }

  private async handleClose(opened: boolean) {
    this.stopHeartbeat();
    this.ws = null;
    if (this.refCount === 0) {
      return;
    }

    if (!opened && tokenStorage.getRefresh()) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        this.reconnectAttempts = 0;
        this.connect();
        return;
      }
    }
    this.scheduleReconnect();
  }

  private buildUrl(token: string | null) {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4201";
    const httpUrl = new URL("/ws/app", base);
    if (token) {
      httpUrl.searchParams.set("token", token);
    }
    this.subscriptions.forEach((_, topic) => {
      httpUrl.searchParams.append("topic", topic);
    });
    const protocol = httpUrl.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${httpUrl.host}${httpUrl.pathname}${httpUrl.search}`;
  }

  private send(message: AppWsEnvelope) {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return;
    }
    this.ws.send(JSON.stringify(message));
  }

  private shouldAuthenticate() {
    return [...this.subscriptions.keys()].some((topic) => requiresAuthenticatedTopic(topic));
  }

  private needsReconnectForAuth() {
    if (!this.ws || this.ws.readyState === WebSocket.CLOSING || this.ws.readyState === WebSocket.CLOSED) {
      return false;
    }
    const nextToken = this.shouldAuthenticate() ? tokenStorage.getAccess() : null;
    return nextToken !== this.currentToken;
  }

  private isSocketActive() {
    return this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING;
  }

  private scheduleConnect() {
    if (this.connectTimer) {
      return;
    }
    this.connectTimer = setTimeout(() => {
      this.connectTimer = null;
      this.connect();
    }, 0);
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      return;
    }
    const attempt = ++this.reconnectAttempts;
    const delay = Math.min(1000 * 2 ** Math.min(attempt - 1, 4), 15000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private async refreshAccessToken() {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    this.refreshInFlight = (async () => {
      const refreshToken = tokenStorage.getRefresh();
      if (!refreshToken) {
        return false;
      }

      try {
        const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4201";
        const response = await fetch(new URL("/api/auth/refresh", base), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) {
          return false;
        }
        const data = (await response.json()) as {
          accessToken: string;
          refreshToken: string;
        };
        if (tokenStorage.getRefresh() !== refreshToken) {
          return false;
        }
        tokenStorage.set(data.accessToken, data.refreshToken);
        return true;
      } catch {
        return false;
      }
    })();

    try {
      return await this.refreshInFlight;
    } finally {
      this.refreshInFlight = null;
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: "PING", topic: "__ping", data: null });
    }, 25000);
  }

  private stopHeartbeat() {
    if (!this.heartbeatTimer) {
      return;
    }
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  private teardown() {
    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
    this.reconnectAttempts = 0;
    this.currentToken = null;
  }
}

const appWsManager = new AppWsManager();

export function useAppWebSocketTopic(
  topic: string | null,
  enabled: boolean,
  listener: AppWsListener,
) {
  const listenerRef = useRef(listener);

  useEffect(() => {
    listenerRef.current = listener;
  }, [listener]);

  useEffect(() => {
    if (!enabled || !topic) {
      return;
    }
    const handler: AppWsListener = (message) => listenerRef.current(message);
    appWsManager.subscribe(topic, handler);
    appWsManager.acquire();
    return () => {
      appWsManager.unsubscribe(topic, handler);
      appWsManager.release();
    };
  }, [enabled, topic]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key?.includes("accessToken")) {
        appWsManager.refreshToken();
      }
    };
    window.addEventListener("storage", onStorage);
    const onAuthLogout = () => appWsManager.refreshToken();
    const onTokenChanged = () => appWsManager.refreshToken();
    window.addEventListener("auth:logout", onAuthLogout);
    window.addEventListener("auth:token-changed", onTokenChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth:logout", onAuthLogout);
      window.removeEventListener("auth:token-changed", onTokenChanged);
    };
  }, []);
}

function requiresAuthenticatedTopic(topic: string) {
  return topic === "orders:operations" || topic === "staff-calls:operations";
}
