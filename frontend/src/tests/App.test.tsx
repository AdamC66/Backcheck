import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { fetchCurrentUser, login } from "@/api/auth";
import { TOKEN_KEY } from "@/lib/tokenStorage";
import { SUPER_ADMIN } from "@/test-mocks";
import { renderWithProviders, screen } from "@/test-utils";
import { App } from "../App";

vi.mock("@/api/auth");

describe("App routing", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  it("lands on the dashboard after a successful login", async () => {
    vi.mocked(login).mockResolvedValue({ token: "test-token", user: SUPER_ADMIN });
    vi.mocked(fetchCurrentUser).mockResolvedValue(SUPER_ADMIN);

    renderWithProviders(<App />, { route: "/login" });

    await userEvent.type(screen.getByLabelText("Email"), "admin@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("keeps an already-authenticated user off the login page", async () => {
    localStorage.setItem(TOKEN_KEY, "test-token");
    vi.mocked(fetchCurrentUser).mockResolvedValue(SUPER_ADMIN);

    renderWithProviders(<App />, { route: "/login" });

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sign in" })).not.toBeInTheDocument();
  });

  it("sends an unauthenticated visitor to the login page", async () => {
    renderWithProviders(<App />, { route: "/" });

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });
});
