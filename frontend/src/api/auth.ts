import { apiClient } from "./client";
import type { TokenResponse, UserOut, Role } from "./types";

export function login(email: string, password: string) {
  return apiClient
    .post<TokenResponse>("/api/auth/login", { email, password })
    .then((r) => r.data);
}

export function me() {
  return apiClient.get<UserOut>("/api/auth/me").then((r) => r.data);
}

export function listUsers() {
  return apiClient.get<UserOut[]>("/api/auth/users").then((r) => r.data);
}

export function createUser(input: { email: string; password: string; full_name: string; role: Role }) {
  return apiClient.post<UserOut>("/api/auth/users", input).then((r) => r.data);
}

export function toggleUser(id: string) {
  return apiClient
    .patch<{ is_active: boolean }>(`/api/auth/users/${id}/toggle`)
    .then((r) => r.data);
}
