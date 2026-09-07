import { describe, expect, it } from "vitest";
import { Outlet, Route, Routes } from "react-router";
import { renderWithProviders, screen } from "@/test-utils";
import { TabNav } from "../TabNav";

const ITEMS = [
  { label: "Gamesheet", to: "", end: true },
  { label: "Stats", to: "stats" },
];

function Layout() {
  return (
    <>
      <TabNav items={ITEMS} label="Game sections" />
      <Outlet />
    </>
  );
}

function renderNav(route: string) {
  renderWithProviders(
    <Routes>
      <Route path="/games/:id" element={<Layout />}>
        <Route index element={<span>sheet</span>} />
        <Route path="stats" element={<span>stats</span>} />
      </Route>
    </Routes>,
    { route },
  );
}

describe("TabNav", () => {
  it("marks the tab matching the current route as current", () => {
    renderNav("/games/1/stats");

    expect(screen.getByRole("link", { name: "Stats" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Gamesheet" })).not.toHaveAttribute("aria-current");
  });
});
