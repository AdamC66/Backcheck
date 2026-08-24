import { request } from "@/lib/apiClient";

export interface Membership {
  role: string;
  scope_type: "league" | "team";
  scopeable_id: number;
  scopeable_name: string;
}

// Field names mirror the API payload exactly (snake_case) rather than being remapped
// on the way in — one less layer to keep in sync while the API is still taking shape.
export interface User {
  id: number;
  email: string;
  is_super_admin: boolean;
  memberships: Membership[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

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
