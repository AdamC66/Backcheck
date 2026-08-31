import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { LineupPlayerPicker, type LineupPlayerPickerProps } from "../LineupPlayerPicker";
import { emptyDraft } from "@/lib/lineup";
import { playerFor, rosterEntryFor } from "@/test-mocks";

const ROSTER = [
  rosterEntryFor({ player: playerFor(1, { last_name: "Pivot", position: "center" }) }),
  rosterEntryFor({ player: playerFor(2, { last_name: "Portside", position: "left_wing" }) }),
  rosterEntryFor({ player: playerFor(3, { last_name: "Swingman", position: "forward" }) }),
  rosterEntryFor({ player: playerFor(4, { last_name: "Blueline", position: "defense" }) }),
  rosterEntryFor({ player: playerFor(5, { last_name: "Netminder", position: "goalie" }) }),
];

function renderPicker(overrides: Partial<LineupPlayerPickerProps>) {
  render(
    <LineupPlayerPicker
      title="Slot"
      roster={ROSTER}
      draft={emptyDraft()}
      filledPlayerId={null}
      onPick={vi.fn()}
      onClear={vi.fn()}
      onClose={vi.fn()}
      {...overrides}
    />,
  );
}

describe("LineupPlayerPicker", () => {
  it("shows only goalies for a goalie slot, with no position filter", () => {
    renderPicker({ slotKind: "goalie" });

    expect(screen.getByLabelText("Search players")).toHaveFocus();
    expect(screen.queryByRole("group", { name: "Filter by position" })).not.toBeInTheDocument();
    expect(screen.getByText("Test Netminder")).toBeInTheDocument();
    expect(screen.queryByText("Test Pivot")).not.toBeInTheDocument();
  });

  it("preselects the slot's wing and filters by exact position, keeping a generic forward", async () => {
    const user = userEvent.setup();
    renderPicker({ slotKind: "forward", defaultPosition: "left_wing" });

    expect(screen.getByRole("button", { name: "LW" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Test Portside")).toBeInTheDocument();
    expect(screen.getByText("Test Swingman")).toBeInTheDocument(); // generic F, unknown wing
    expect(screen.queryByText("Test Pivot")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Blueline")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "C" }));
    expect(screen.getByText("Test Pivot")).toBeInTheDocument();
    expect(screen.queryByText("Test Portside")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText("Test Blueline")).toBeInTheDocument();
    expect(screen.queryByText("Test Netminder")).not.toBeInTheDocument();
  });
});
