const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
export const AUTH_EXPIRED_EVENT = "retain:auth-expired";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.name = "ApiError"; this.status = status; }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("retain_token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    if (response.status === 401 && token) window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new ApiError(body?.error ?? "The request could not be completed.", response.status);
  }
  return response.json() as Promise<T>;
}

export type AuthPayload = { user: import("../types/retain").User; token: string };
