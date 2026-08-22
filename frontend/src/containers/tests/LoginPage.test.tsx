import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { login } from "@/models/auth";
import { ApiError } from "@/lib/apiClient";
import { TOKEN_KEY } from "@/lib/tokenStorage";
import { SUPER_ADMIN } from "@/test-mocks";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import { LoginPage } from "../LoginPage";

vi.mock("@/models/auth");

async function submitCredentials() {
  await userEvent.type(screen.getByLabelText("Email"), "admin@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "password123");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  it("stores the issued token when the credentials are accepted", async () => {
    vi.mocked(login).mockResolvedValue({ token: "test-token", user: SUPER_ADMIN });

    renderWithProviders(<LoginPage />);
    await submitCredentials();

    // react-query hands mutationFn a second context argument, hence the trailing matcher.
    expect(login).toHaveBeenCalledWith(
      { email: "admin@example.com", password: "password123" },
      expect.anything(),
    );
    await waitFor(() => {
      expect(localStorage.getItem(TOKEN_KEY)).toBe("test-token");
    });
  });

  it("surfaces the API's message when the credentials are rejected", async () => {
    vi.mocked(login).mockRejectedValue(
      new ApiError("invalid_credentials", "Invalid email or password", 401),
    );

    renderWithProviders(<LoginPage />);
    await submitCredentials();

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});
