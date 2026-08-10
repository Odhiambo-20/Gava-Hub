import { apiRequest } from "./client";
import type { LoginRequest, RegisterRequest, TokenResponse } from "./types";

const SESSION_KEY = "gavahub.session";
export const AUTH_CHANGED_EVENT = "gavahub:auth-changed";

export function login(request: LoginRequest) {
  return apiRequest<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function register(request: RegisterRequest) {
  return apiRequest<TokenResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function saveSession(session: TokenResponse) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function getSession(): TokenResponse | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(SESSION_KEY);
  if (!value) return null;
  try {
    const session = JSON.parse(value) as TokenResponse;
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function authorizationHeader(): Record<string, string> {
  const session = getSession();
  return session ? { Authorization: `${session.tokenType} ${session.accessToken}` } : {};
}

export function authenticatedRequest<T>(path: string, init: RequestInit = {}) {
  return apiRequest<T>(path, {
    ...init,
    headers: {
      ...authorizationHeader(),
      ...Object.fromEntries(new Headers(init.headers).entries()),
    },
  });
}
