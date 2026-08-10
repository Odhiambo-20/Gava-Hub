import type { ApiErrorBody } from "./types";

const API_BASE_URL = (import.meta.env["VITE_API_BASE_URL"] || "/api/v1").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly violations: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // Non-JSON gateway errors still become a useful ApiError.
    }
    const validation = Object.values(body.violations ?? {})[0];
    throw new ApiError(
      validation ?? body.message ?? `Request failed (${response.status})`,
      response.status,
      body.violations,
    );
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
