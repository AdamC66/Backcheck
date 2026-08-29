import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test-utils";
import { AppSidebar } from "../AppSidebar";

const NAV = [
  { label: "First", to: "", end: true },
  { label: "Second", to: "second" },
];

describe("AppSidebar", () => {
  it("renders the nav items and back link", () => {
    renderWithProviders(
      <AppSidebar
        backTo="/"
        backLabel="Home"
        navItems={NAV}
        navLabel="Sections"
        header={<span>Header</span>}
      />,
    );

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("navigation", { name: "Sections" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Second" })).toBeInTheDocument();
  });

  it("collapses and expands", async () => {
    renderWithProviders(
      <AppSidebar
        backTo="/"
        backLabel="Home"
        navItems={NAV}
        navLabel="Sections"
        header={<span>Header</span>}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Collapse navigation" }));
    expect(screen.queryByRole("link", { name: "Second" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Expand navigation" }));
    expect(screen.getByRole("link", { name: "Second" })).toBeInTheDocument();
  });
});
