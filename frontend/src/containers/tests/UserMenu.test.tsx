import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { fetchCurrentUser, logout } from "@/models/auth";
import { TOKEN_KEY } from "@/lib/tokenStorage";
import { SUPER_ADMIN, TEAM_USER } from "@/test-mocks";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import { UserMenu } from "../UserMenu";

vi.mock("@/models/auth");

async function renderSignedIn(user = SUPER_ADMIN) {
  localStorage.setItem(TOKEN_KEY, "test-token");
  vi.mocked(fetchCurrentUser).mockResolvedValue(user);

  renderWithProviders(<UserMenu />);

  return screen.findByRole("button", { name: /account menu/i });
}

describe("UserMenu", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  it("signs out through the menu, clearing the stored token", async () => {
    vi.mocked(logout).mockResolvedValue(undefined);
    const trigger = await renderSignedIn();

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));

    expect(logout).toHaveBeenCalled();
    await waitFor(() => {
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });
  });

  it("closes on Escape without signing out", async () => {
    const trigger = await renderSignedIn();

    await userEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
  });

  it("shows an Admin link for a super admin", async () => {
    const trigger = await renderSignedIn();

    await userEvent.click(trigger);

    expect(screen.getByRole("menuitem", { name: "Admin" })).toBeInTheDocument();
  });

  it("hides the Admin link for a non-super-admin user", async () => {
    const trigger = await renderSignedIn(TEAM_USER);

    await userEvent.click(trigger);

    expect(screen.queryByRole("menuitem", { name: "Admin" })).not.toBeInTheDocument();
  });
});
