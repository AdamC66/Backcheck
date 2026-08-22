import { createContext } from "react";
import type { LoginCredentials, User } from "@/models/auth";

export interface AuthContextValue {
  user: User | null;
  /** True only while a stored token is being exchanged for an identity on boot. */
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoggingIn: boolean;
  loginError: string | null;
}

// Lives apart from AuthProvider so that file can export only its component —
// react-refresh can't hot-reload a module that mixes components with other values.
export const AuthContext = createContext<AuthContextValue | null>(null);
