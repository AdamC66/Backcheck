import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test-utils";
import { SideNav } from "../SideNav";

const ITEMS = [
  { label: "Overview", to: "/teams/1", end: true },
  { label: "Schedule", to: "/teams/1/schedule" },
];

describe("SideNav", () => {
  it("marks the section matching the current route as current, and no other", () => {
    renderWithProviders(<SideNav items={ITEMS} label="Team sections" />, {
      route: "/teams/1/schedule",
    });

    expect(screen.getByRole("link", { name: "Schedule" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
  });

  it("only marks an end item current on an exact match, not a nested route", () => {
    renderWithProviders(<SideNav items={ITEMS} label="Team sections" />, {
      route: "/teams/1",
    });

    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
  });
});
