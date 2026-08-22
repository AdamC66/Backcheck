import { Text } from "@/components/Text/Text";

// Shown by both route guards while a stored token is being exchanged for an identity.
// Neither guard may render its real content yet: one would flash the login form at an
// already-authenticated user, the other would bounce them to /login on every refresh.
export function AuthPending() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Text tone="muted">Loading…</Text>
    </main>
  );
}
