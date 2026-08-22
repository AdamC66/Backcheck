import { request } from "@/api/client";
import type { LoginCredentials, LoginResult, User } from "@/types/auth";

export function login(credentials: LoginCredentials): Promise<LoginResult> {
  return request<LoginResult>("/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function logout(): Promise<void> {
  return request<void>("/logout", { method: "DELETE" });
}

export function fetchCurrentUser(): Promise<User> {
  return request<User>("/me");
}
