import { useState, type FormEvent } from "react";
import { Button } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { Stack } from "@/components/Stack/Stack";
import { Text } from "@/components/Text/Text";
import { TextInput } from "@/components/TextInput/TextInput";
import { useAuth } from "@/auth/useAuth";

export function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await login({ email, password });
    } catch {
      // Surfaced through loginError — rethrowing here would only reach the console.
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card variant="elevated" padding="lg" className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            <Text variant="heading">Sign in</Text>

            <Stack gap="md">
              <TextInput
                id="email"
                label="Email"
                type="email"
                value={email}
                autoComplete="email"
                required
                onChange={(event) => setEmail(event.target.value)}
              />

              <TextInput
                id="password"
                label="Password"
                type="password"
                value={password}
                autoComplete="current-password"
                required
                onChange={(event) => setPassword(event.target.value)}
              />
            </Stack>

            {loginError === null ? null : (
              <Text variant="body" tone="danger">
                {loginError}
              </Text>
            )}

            <Button type="submit" disabled={isLoggingIn} fullWidth>
              {isLoggingIn ? "Signing in…" : "Sign in"}
            </Button>
          </Stack>
        </form>
      </Card>
    </main>
  );
}
