// Field names mirror the API payload exactly (snake_case) rather than being remapped
// on the way in — one less layer to keep in sync while the API is still taking shape.
export interface User {
  id: number;
  email: string;
  is_super_admin: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: User;
}
