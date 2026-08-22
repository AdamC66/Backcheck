export const TOKEN_KEY = "backcheck_auth_token";

// Every access is guarded: localStorage throws outright in some privacy modes rather
// than returning null, and a dead token store must not take the whole app down.
export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Session simply won't survive a refresh.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing was stored to begin with.
  }
}
