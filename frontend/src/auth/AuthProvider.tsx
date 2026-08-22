import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext, type AuthContextValue } from "@/auth/authContext";
import { ApiError } from "@/lib/apiClient";
import { clearToken, readToken, writeToken } from "@/lib/tokenStorage";
import {
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  type LoginCredentials,
} from "@/models/auth";
import { CURRENT_USER_KEY } from "@/models/queryKeys";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => readToken());

  const currentUser = useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: async () => {
      try {
        return await fetchCurrentUser();
      } catch (error) {
        // A stored token the API rejects (expired, or revoked by a logout elsewhere) is
        // worse than none, so it's discarded where the rejection is observed. No state
        // update is needed: a failed query leaves `data` undefined, which already
        // renders as signed-out.
        if (error instanceof ApiError && error.status === 401) {
          clearToken();
        }
        throw error;
      }
    },
    enabled: token !== null,
    retry: false,
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (result) => {
      writeToken(result.token);
      setToken(result.token);
      queryClient.setQueryData(CURRENT_USER_KEY, result.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    // Cleanup is in onSettled: if revocation fails the local session still has to end,
    // otherwise the UI stays logged in against a token the user asked to discard.
    onSettled: () => {
      clearToken();
      setToken(null);
      queryClient.clear();
    },
  });

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      await loginMutation.mutateAsync(credentials);
    },
    [loginMutation],
  );

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: currentUser.data ?? null,
      isLoading: token !== null && currentUser.isPending,
      login,
      logout,
      isLoggingIn: loginMutation.isPending,
      loginError:
        loginMutation.error instanceof ApiError
          ? loginMutation.error.message
          : loginMutation.error === null
            ? null
            : "Something went wrong. Please try again.",
    }),
    [
      currentUser.data,
      currentUser.isPending,
      token,
      login,
      logout,
      loginMutation.isPending,
      loginMutation.error,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
