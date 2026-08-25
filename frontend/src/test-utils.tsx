import type { ReactElement, ReactNode } from "react";
import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { AuthProvider } from "@/auth/AuthProvider";
import { ToastProvider } from "@/toast/ToastProvider";

// Retries and caching make tests slow and order-dependent, so each render gets a
// fresh client with both switched off.
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  route?: string;
}

// One place that knows how the app is wrapped, so a new global provider is a
// one-line change here rather than an edit to every test file.
export function renderWithProviders(
  ui: ReactElement,
  { route = "/", ...options }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={[route]}>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

// Re-exported explicitly rather than with `export *` so imports stay greppable and the
// react-refresh lint rule can still tell what this module exposes.
export { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
